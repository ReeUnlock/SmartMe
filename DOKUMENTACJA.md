# SmartMe — Kompletna Dokumentacja Aplikacji

> Personalny hub zarządzania życiem. Mobile-first, ciepłe pastele, UI po polsku.
> Domena: `smartme.rafaldebski.com`

---

## Spis treści

1. [Architektura i Stack](#1-architektura-i-stack)
2. [Infrastruktura](#2-infrastruktura)
3. [Backend — Modele i Baza Danych](#3-backend--modele-i-baza-danych)
4. [Backend — API Endpoints](#4-backend--api-endpoints)
5. [Backend — Logika Biznesowa](#5-backend--logika-biznesowa)
6. [Frontend — Routing i Providers](#6-frontend--routing-i-providers)
7. [Frontend — Hooks i State Management](#7-frontend--hooks-i-state-management)
8. [Frontend — Warstwa API](#8-frontend--warstwa-api)
9. [Frontend — Utilities](#9-frontend--utilities)
10. [Frontend — Komponenty](#10-frontend--komponenty)
11. [System Nagród SmartMe](#11-system-nagród-smartme)
12. [System Animacji (Motion)](#12-system-animacji-motion)
13. [System Dźwięków](#13-system-dźwięków)
14. [System Avatarów i Afirmacji](#14-system-avatarów-i-afirmacji)
15. [Komendy Głosowe](#15-komendy-głosowe)
16. [Design System](#16-design-system)
17. [Bezpieczeństwo](#17-bezpieczeństwo)
18. [Deploy i Produkcja](#18-deploy-i-produkcja)
19. [Komendy Developerskie](#19-komendy-developerskie)
20. [Fazy Implementacji](#20-fazy-implementacji)

---

## 1. Architektura i Stack

### Stack technologiczny

| Warstwa | Technologia |
|---------|-------------|
| Backend | Python 3.12, FastAPI 0.115, SQLAlchemy 2.0, Alembic 1.14 |
| Baza danych | PostgreSQL 16 |
| Frontend | React 19, Vite 6, Chakra UI v3.3, React Router v7.1 |
| State (server) | TanStack Query v5.62 |
| State (client) | Zustand v5 + localStorage |
| Infra | Docker Compose, Nginx Alpine |
| AI | OpenAI API (Whisper transkrypcja + GPT-4o-mini parsowanie intencji) |
| OCR | Tesseract + tesseract-ocr-pol (w obrazie Docker) |

### Porty (dev)

| Serwis | Port zewnętrzny | Port wewnętrzny |
|--------|----------------|-----------------|
| PostgreSQL | 5433 | 5432 |
| Backend (FastAPI) | 8001 | 8000 |
| Frontend (Vite) | 3001 | 3000 |
| Nginx | 81 (HTTP), 444 (HTTPS) | 80, 443 |

Aplikacja dostępna pod `http://localhost:81`

### Architektura wysokopoziomowa

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Nginx      │────▶│   Frontend   │     │   Backend    │
│   (reverse   │     │   (React     │     │   (FastAPI   │
│   proxy)     │────▶│    + Vite)   │     │   + SQLAlch) │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                           ┌──────▼───────┐
                                           │  PostgreSQL   │
                                           │  16           │
                                           └──────────────┘
```

---

## 2. Infrastruktura

### Docker Compose (dev)

**Serwisy:**
- `db` — PostgreSQL 16 Alpine, healthcheck via `pg_isready`, volume `pgdata`, restart `unless-stopped`
- `backend` — Python 3.12 slim, hot-reload (volume mount), zależy od `db` (healthy)
- `frontend` — Node 20 Alpine, Vite dev server z `usePolling: true` (Windows Docker HMR)
- `nginx` — Nginx Alpine, reverse proxy, gzip, security headers

**Volumes:** `pgdata` (dane DB), `uploads` (pliki OCR/voice)

### Nginx

- Max body size: 10MB (upload audio/paragonów)
- Gzip: poziom 4, min 256 bajtów, typy: text/plain, css, js, json, xml, svg
- Security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`
- `/api/` → proxy do backendu (timeout 120s read/send, buffering on)
- `/` → proxy do frontendu (z WebSocket upgrade dla HMR)

### Backend Dockerfile

- Base: `python:3.12-slim`
- Instaluje: `tesseract-ocr`, `tesseract-ocr-pol`, `curl`
- Healthcheck: `curl -f http://localhost:8000/api/health` co 30s (start-period 40s)
- CMD: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload`

### Frontend Dockerfile (dev)

- Base: `node:20-alpine`
- CMD: `npm run dev` (Vite dev server, host 0.0.0.0, port 3000)

### Vite Config

- Code splitting: `vendor-react`, `vendor-chakra`, `vendor-query`, `vendor-utils`
- `allowedHosts`: `["smartme.rafaldebski.com"]`
- Watch: polling co 1000ms (Docker na Windows)
- Dev server: host 0.0.0.0, port 3000

### Zależności

**Backend (requirements.txt):**
fastapi 0.115.6, uvicorn 0.34.0, sqlalchemy 2.0.36, psycopg2-binary 2.9.10, alembic 1.14.0, pydantic[email] 2.10.3, python-jose[cryptography] 3.3.0, passlib[bcrypt] 1.7.4, bcrypt 4.0.1, python-dateutil 2.9.0, openai >=1.40.0, python-multipart >=0.0.9, python-dotenv 1.0.1, APScheduler 3.11.0, pywebpush 2.0.1, pytesseract 0.3.13, Pillow 11.1.0

**Frontend (package.json):**
react 19, react-dom 19, react-router-dom 7.1, @chakra-ui/react 3.3.0, @emotion/react 11.14, @tanstack/react-query 5.62, zustand 5.0.2, dayjs 1.11.13, react-icons 5.4, vite 6

---

## 3. Backend — Modele i Baza Danych

### Konfiguracja bazy

```python
pool_pre_ping = True       # Walidacja połączenia przed użyciem
pool_size = 5              # Połączenia w puli
max_overflow = 10          # Dodatkowe połączenia
pool_recycle = 1800        # Recykling po 30 min
```

Migracje: Alembic (16 plików migracyjnych), auto-uruchamiane przy starcie kontenera.

### Tabele (13 tabel)

#### `users`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| username | String(50), unique | Nazwa użytkownika |
| email | String(120), unique | Email |
| hashed_password | String(255) | Bcrypt hash |
| is_active | Boolean | default True |
| onboarding_completed | Boolean | default False |
| created_at / updated_at | DateTime TZ | Automatyczne (TimestampMixin) |

#### `events` (Kalendarz)
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| title | String(255) | Tytuł wydarzenia |
| description | Text | Opis (opcjonalny) |
| start_at | DateTime TZ | Początek (indexed) |
| end_at | DateTime TZ | Koniec (opcjonalny) |
| all_day | Boolean | Całodniowe |
| color | String(20) | Kolor w kalendarzu |
| icon | String(30) | Ikona emoji |
| category | String(50) | Kategoria (niewykorzystane w UI) |
| location | String(255) | Lokalizacja (niewykorzystane w UI) |
| rrule | String(500) | Reguła powtarzania (RFC 5545) |
| google_event_id | String | Do przyszłej integracji Google Calendar |
| google_calendar_id | String | Do przyszłej integracji Google Calendar |
| google_sync_token | String | Do przyszłej integracji Google Calendar |

Indeksy: `ix_events_user_id`, `ix_events_start_at`, `ix_events_user_start`

#### `shopping_lists`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| name | String(255) | Nazwa listy |
| store_name | String(100) | Sklep (opcjonalny) |
| is_completed | Boolean | Zakończona |

Relationship: `items` (ShoppingItem, cascade delete)

#### `shopping_categories`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| name | String(100) | Nazwa kategorii |
| icon | String(50) | Ikona (opcjonalny) |
| sort_order | Integer | Kolejność (default 0) |

Domyślne (8): Owoce i warzywa, Nabiał, Pieczywo, Mięso i ryby, Napoje, Chemia, Przekąski, Inne

#### `shopping_items`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| list_id | Integer FK→shopping_lists | Lista (CASCADE, indexed) |
| category_id | Integer FK→shopping_categories | Kategoria (SET NULL) |
| name | String(255) | Nazwa produktu |
| quantity | Float | Ilość |
| unit | String(30) | Jednostka (kg, szt, l) |
| is_checked | Boolean | Kupiony |
| sort_order | Integer | Kolejność |

#### `expense_categories`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| name | String(100) | Nazwa kategorii |
| icon | String(50) | Ikona (opcjonalny) |
| color | String(30) | Kolor hex (opcjonalny) |
| sort_order | Integer | Kolejność (default 0) |

Domyślne (9): Jedzenie, Transport, Rozrywka, Zdrowie, Dom, Ubrania, Rachunki, Edukacja, Inne

#### `household_members`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| name | String(100) | Imię |

Domyślne (2): "Ja", "Partner"
Relationships: `expenses`, `recurring_expenses`

#### `expenses`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| amount | Float | Kwota w PLN |
| description | String(500) | Opis |
| date | Date | Data wydatku (indexed) |
| is_shared | Boolean | Wspólny wydatek |
| category_id | Integer FK→expense_categories | Kategoria (SET NULL) |
| paid_by_id | Integer FK→household_members | Kto płacił (SET NULL) |
| source | String(50) | Źródło: "shopping_list", "recurring" |
| source_id | Integer | ID źródła |
| recurring_id | Integer | ID szablonu cyklicznego (indexed) |

Indeksy: `ix_expenses_user_id`, `ix_expenses_date`, `ix_expenses_user_date`, `ix_expenses_source`, `ix_expenses_recurring_id`, `ix_expenses_user_category_date`

#### `recurring_expenses`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| name | String(255) | Nazwa wydatku |
| amount | Float | Kwota |
| day_of_month | Integer | Dzień miesiąca (1-31) |
| is_shared | Boolean | Wspólny |
| category_id | Integer FK→expense_categories | Kategoria (SET NULL) |
| paid_by_id | Integer FK→household_members | Kto płaci (SET NULL) |

#### `monthly_budgets`
Unique constraint: `(user_id, year, month)` — jeden budżet na miesiąc.
Kolumny: id, user_id, year, month, amount.

#### `goals`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| title | String(255) | Tytuł celu |
| description | Text | Opis (opcjonalny) |
| category | String(50) | finanse/zdrowie/rozwoj/podroze/dom/inne |
| color | String(30) | Kolor (opcjonalny) |
| goal_type | String(20) | manual / savings / spending_limit |
| target_value | Float | Wartość docelowa |
| current_value | Float | Aktualny postęp (default 0) |
| unit | String(30) | Jednostka (zł, kg, km) |
| deadline | Date | Termin |
| is_completed | Boolean | Ukończony |
| sort_order | Integer | Kolejność |
| linked_category_id | Integer FK→expense_categories | Dla spending_limit (SET NULL, indexed) |

Relationship: `milestones` (Milestone, cascade delete, ordered by sort_order)

#### `milestones`
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| goal_id | Integer FK→goals | Cel (CASCADE, indexed) |
| title | String(255) | Kamień milowy |
| is_completed | Boolean | Ukończony |
| sort_order | Integer | Kolejność |

#### `bucket_items` (Bucket lista)
| Kolumna | Typ | Opis |
|---------|-----|------|
| id | Integer PK | — |
| user_id | Integer FK→users | Właściciel (indexed) |
| title | String(255) | Marzenie/cel |
| description | Text | Opis (opcjonalny) |
| category | String(50) | podroze/rozwoj/zdrowie/finanse/inne |
| is_completed | Boolean | Zrealizowane |
| completed_date | Date | Data realizacji |
| sort_order | Integer | Kolejność |

#### `feedback`
Anonimowy (brak `user_id`). Kolumny: id, message (text), category (bug/idea/opinion/broken), email (opcjonalny), user_agent, created_at.

---

## 4. Backend — API Endpoints

Wszystkie endpointy pod `/api/`. JWT wymagany oprócz zaznaczonych.
7 routerów zarejestrowanych w `main.py`.

### Auth (`/api/auth`) — 7 endpoints

| Metoda | Ścieżka | Auth | Rate limit | Opis |
|--------|---------|------|------------|------|
| GET | `/status` | Nie | — | Czy setup zakończony |
| POST | `/setup` | Nie | 3/min | Tworzenie pierwszego konta (blokuje jeśli user istnieje) |
| POST | `/login` | Nie | 5/min | Logowanie → JWT (username lub email) |
| GET | `/me` | Tak | — | Dane zalogowanego użytkownika |
| POST | `/change-password` | Tak | 5/min | Zmiana hasła |
| POST | `/complete-onboarding` | Tak | — | Zakończenie onboardingu |
| POST | `/reset` | Tak | — | Reset konta + dane (wyłączony w prod) |

### Kalendarz (`/api/calendar`) — 5 endpoints

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/events?start=&end=` | Lista wydarzeń (z ekspansją RRULE) |
| POST | `/events` | Nowe wydarzenie (409 jeśli duplikat w dniu) |
| GET | `/events/{id}` | Szczegóły wydarzenia |
| PUT | `/events/{id}` | Edycja wydarzenia |
| DELETE | `/events/{id}` | Usunięcie wydarzenia |

### Zakupy (`/api/shopping`) — 15 endpoints

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/categories` | Kategorie (auto-tworzy domyślne) |
| POST | `/categories` | Nowa kategoria |
| PUT | `/categories/{id}` | Edycja kategorii |
| DELETE | `/categories/{id}` | Usunięcie (blokuje "Inne") |
| GET | `/lists` | Wszystkie listy z itemami |
| POST | `/lists` | Nowa lista |
| GET/PUT/DELETE | `/lists/{id}` | CRUD listy |
| POST | `/lists/{id}/items` | Dodaj produkt |
| PUT | `/items/{id}` | Edytuj produkt |
| DELETE | `/items/{id}` | Usuń produkt |
| PATCH | `/items/{id}/toggle` | Zaznacz/odznacz |
| PUT | `/lists/{id}/reorder` | Zmień kolejność (bulk sort_order) |
| POST | `/lists/{id}/to-expense` | Konwertuj na wydatek (smart split) |

### Wydatki (`/api/expenses`) — 21+ endpoints

**Wydatki CRUD:**
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/` | Lista wydatków (filtry: year, month, category_id, paid_by_id) |
| POST | `/` | Nowy wydatek |
| GET/PUT/DELETE | `/{id}` | CRUD wydatku |

**Kategorie i domownicy:**
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/categories` | Kategorie wydatków (auto-tworzy domyślne) |
| POST/PUT/DELETE | `/categories/{id}` | CRUD kategorii |
| GET | `/members` | Domownicy (auto-tworzy "Ja", "Partner") |
| POST/PUT/DELETE | `/members/{id}` | CRUD domownika |

**Cykliczne:**
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/recurring/list` | Lista szablonów |
| POST | `/recurring` | Nowy szablon |
| PUT/DELETE | `/recurring/{id}` | Edycja/usunięcie szablonu |
| POST | `/recurring/generate` | Generuj wydatki na miesiąc (year, month) |

**Budżet i podsumowania:**
| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/budget/{year}/{month}` | Budżet miesięczny (lub null) |
| PUT | `/budget/{year}/{month}` | Ustaw/zaktualizuj budżet (upsert) |
| GET | `/summary/{year}/{month}` | Podsumowanie (total, by_category, by_member, daily, recurring_total, budget) |
| GET | `/comparison/{year}/{month}` | Porównanie z poprzednim miesiącem (diff_total, diff_percent) |

### Plany (`/api/plans`) — 13+ endpoints

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| GET | `/summary` | Podsumowanie (totale, nadchodzące deadline'y) |
| GET | `/goals` | Lista celów (pagination: skip, limit, z computed_expense_total) |
| POST | `/goals` | Nowy cel |
| GET/PUT/DELETE | `/goals/{id}` | CRUD celu |
| POST | `/goals/{id}/milestones` | Nowy kamień milowy |
| PUT/DELETE | `/milestones/{id}` | Edycja/usunięcie milestone |
| PATCH | `/milestones/{id}/toggle` | Przełącz ukończenie milestone |
| GET | `/bucket` | Bucket lista |
| POST | `/bucket` | Nowy element |
| PUT/DELETE | `/bucket/{id}` | CRUD elementu |
| PATCH | `/bucket/{id}/toggle` | Przełącz realizację |

### Komendy głosowe (`/api/voice`) — 2 endpoints

| Metoda | Ścieżka | Opis |
|--------|---------|------|
| POST | `/process` | Upload audio → transkrypcja Whisper + parsowanie intencji GPT |
| POST | `/execute` | Wykonanie potwierdzonej akcji |

### Inne

| Metoda | Ścieżka | Auth | Rate limit | Opis |
|--------|---------|------|------------|------|
| POST | `/api/feedback` | Nie | 5/min | Wysłanie opinii |
| GET | `/api/health` | Nie | — | Healthcheck (DB ping → 200/503) |

---

## 5. Backend — Logika Biznesowa

### Duplikaty w kalendarzu
Backend odrzuca (409) tworzenie wydarzenia jeśli ten sam `title` już istnieje w danym dniu (porównanie po dacie, nie datetime). Frontend wyszarza quick-add buttony na podstawie istniejących wydarzeń.

### Ekspansja RRULE
- `expand_events()` w `calendar/service.py` rozwija wydarzenia cykliczne w zakresie dat
- Pobiera eventy z `start_at <= range_end` OR `rrule IS NOT NULL`
- Max 365 dni do przodu
- Zwraca płaską listę z polem `virtual_date` dla rozszerzonych wystąpień
- Walidacja RRULE przez `dateutil.rrule.rrulestr()`

### Konwersja zakupów → wydatki
Inteligentny podział kwoty proporcjonalnie do kategorii produktów:
- Jeśli użytkownik podaje kategorię: jeden wydatek
- W przeciwnym razie: split po liczbie itemów per kategoria
- **Mapowanie kategorii:**
  - "Owoce/Nabiał/Pieczywo/Mięso/Napoje/Przekąski" → "Jedzenie"
  - "Chemia" → "Dom"
  - "Inne" → "Inne"
- Zaokrąglenie bankierskie, ostatnia kategoria dostaje resztę

### Generowanie wydatków cyklicznych
- `POST /api/expenses/recurring/generate {year, month}`
- Iteruje szablony `RecurringExpense`, tworzy `Expense` jeśli nie istnieje w danym miesiącu
- `day_of_month` clampowany do ostatniego dnia miesiąca (np. 31 → 28 w lutym)
- Nigdy nie tworzy duplikatów (sprawdza `recurring_id` + miesiąc)

### Cele typu spending_limit
- Powiązane z kategorią wydatków przez `linked_category_id`
- Przy pobieraniu celu backend oblicza `computed_expense_total` (suma wydatków w bieżącym miesiącu)
- Batch query: jedna agregacja dla wszystkich spending_limit goals

### Mergowanie kategorii w podsumowaniach
Wydatki bez kategorii (NULL) + "Inne" łączone w jeden bucket w `MonthSummary.by_category`.

### Global Exception Handler
Łapie nieobsłużone wyjątki i zwraca 500 z polskim komunikatem. Loguje szczegóły do stdout.

---

## 6. Frontend — Routing i Providers

### Providers (zagnieżdżone)

```
ChakraProvider (theme)
  └─ ErrorBoundary (global catch)
      └─ QueryClientProvider (retry=1, staleTime=30s, mutation error → ErrorToast)
          └─ BrowserRouter
              └─ Routes + Global Overlays
```

### Routing (polskie ścieżki)

| Ścieżka | Komponent | Opis |
|----------|-----------|------|
| `/setup` | SetupPage | Pierwsze uruchomienie |
| `/login` | LoginPage | Logowanie |
| `/witaj` | OnboardingPage | Onboarding (avatar + powitanie) |
| `/` | DashboardPage | Dashboard (chronione) |
| `/kalendarz` | CalendarPage | Kalendarz |
| `/zakupy` | ShoppingPage | Listy zakupów |
| `/wydatki` | ExpensesPage | Wydatki |
| `/plany` | PlansPage | Cele i plany |
| `/ustawienia` | SettingsPage | Ustawienia |
| `/odznaki` | AchievementsPageWrapper | Gablotka osiągnięć |
| `/wyzwania` | ChallengesPageWrapper | Wyzwania dzienne/tygodniowe |
| `/postacie` | AvatarSelectionPageWrapper | Kolekcja postaci |

Wszystkie trasy poza `/setup`, `/login`, `/witaj` chronione przez `ProtectedRoute`.

### Globalne overlaye (lazy-loaded)

- `SparkToast` — toast "+N Iskier" (2.6s, pill)
- `AchievementToast` — toast odblokowania odznaki/challenge (3.5s, gradient card)
- `CelebrationOverlay` — system cząsteczek (imperative RAF)
- `AvatarReaction` — bąbelki avatara (3.5s)
- `SuccessToast` / `ErrorToast` — powiadomienia sukcesu/błędu

---

## 7. Frontend — Hooks i State Management

### Zustand stores (client state, localStorage)

#### `useAuth`
- **State:** `user`, `token`, `isLoading`
- **Metody:** `setToken()`, `setUser()`, `loadUser()`, `needsOnboarding()`, `logout()`
- **Logika:** JWT expiration check (60s buffer), timeout 10s

#### `useEventHistory`
- **State:** `past[]` (max 3), `future[]` (max 3)
- **Metody:** `pushAction()`, `popUndo()`, `popRedo()`, `canUndo()`, `canRedo()`
- **Typy:** create → delete on undo, update → restore previous, delete → recreate

#### `useExpenseUndo`
- **State:** `stack[]` (max 5)
- **Metody:** `push()`, `pop()`, `clear()`

#### `useRewards`
- **State:** `sparks`, `level`, `xp`, `xpToNextLevel`, `streakDays`, `lastActiveDate`, `_toasts`
- **Storage:** `smartme_rewards`
- **Metody:** `reward(action)`, `addBonusSparks(amount)`, `syncDaily()`
- **Logika:** Level-up → celebration + avatar reaction + sound

#### `useAchievements`
- **State:** `unlocked[]`, `progress{}`, `unlockedFeatures{}`, `lastCheckedLevel`
- **Storage:** `smartme_achievements`
- **Metody:** `trackProgress(key, increment)`, `updateMaxStreak()`, `checkLevelRewards()`, `initialCheck()`, `dismissAchievementToast()`

#### `useChallenges`
- **State:** `daily{date, items[]}`, `weekly{weekKey, items[]}`, `weekActiveDays[]`, `_challengeToasts`
- **Storage:** `smartme_challenges`
- **Metody:** `sync()`, `trackAction(type)`, `claimReward()`, `claimAllBonus()`, `dismissChallengeToast()`
- **Logika:** Seeded random per dzień/tydzień, deterministyczny wybór wyzwań

#### `useCelebration`
- **State:** `active{type, id, options}`, `_lastFired{}`
- **Metody:** `celebrate(type, options?)`, `dismiss()`
- **Priorytety:** progress(0) < affirmation(1) < reward(2) < achievement(3) < levelup(4)
- **Cooldowns:** progress 3s, affirmation 2s, reward 1.5s, achievement/levelup: brak

#### `useAvatarReaction`
- **State:** `activeReaction{type, message, emoji, avatarKey}`, `_lastFired{}`, `_sessionCount` (max 20)
- **Metody:** `react(type, payload?)`, `dismiss()`
- **Logika:** Probability roll + cooldown per typ, fallback do Sol

#### `useVoiceCommand`
- **State:** `isRecording`, `isProcessing`, `proposedActions[]`, `transcript`, `error`, `recordingDuration`, `chatHistory[]`
- **Metody:** `startRecording()`, `stopRecording()`, `confirmAction(editedActions, queryClient)`, `cancelAction()`, `clearError()`
- **Formaty:** webm (opus) → ogg → mp4 (iOS) → aac (iOS fallback)
- **Auto-stop:** 60 sekund, max chat history: 10 par

#### `useQuickTemplates` (szablony kalendarza)
- **Storage:** `anelka_quick_templates` (max 8)
- **Metody:** `addTemplate`, `removeTemplate`, `updateTemplate`, `reorderTemplate`, `resetToDefaults`
- **Defaults:** Szpital, Klinika, Dzieci, Trening, Dyżur, Zejście, Wolne

#### `useShoppingTemplates`
- **Storage:** `anelka_shopping_templates` (max 20)
- **Metody:** `saveTemplate(name, items, storeName)`, `removeTemplate`

#### `useItemHistory`
- **Storage:** `anelka_item_history` (max 100 items, LRU pruning)
- **Metody:** `recordItem(name, categoryId)`, `getTopItems(limit)`

#### `useSoundSettings`
- **Storage:** `smartme_sound_settings`
- **State:** `enabled`, `volume` (0–1)
- **Metody:** `setEnabled`, `setVolume`, `toggle`

### TanStack Query hooks (server state)

#### `useCalendar`
- `useEvents(start, end)`, `useCreateEvent()`, `useUpdateEvent()`, `useDeleteEvent()`
- Integracja z `useEventHistory` (undo/redo side effects)
- QueryKey: `["events", start, end]`

#### `useShopping`
- `useShoppingLists()`, `useShoppingList(id)`, CRUD hooks
- `useToggleItem()` — optimistic update z rollback on error
- `useCategories()` — staleTime 5min
- `useSaveListAsExpense()` — bridge zakupy→wydatki

#### `useExpenses`
- CRUD expenses, categories, members, recurring, budget, summary, comparison
- Members i categories: staleTime 5min
- Summary/comparison: cache invalidation na mutacjach
- `useUndoExpense()` — undo callback integration

#### `usePlans`
- Goals CRUD, Milestones CRUD, Bucket CRUD
- `usePlansSummary()` — cross-invalidation z goals
- `useToggleMilestone()`, `useToggleBucketItem()`

### React hooks (lightweight)

#### `useMicroFeedback()`
- Imperatywne dodawanie klas CSS animacji (zero re-renderów)
- `trigger(animClass, targetEl)` — classList manipulation
- Auto-remove po `animationend`, safety timeout 1s

#### `useKeyboardOpen()`
- Wykrywa klawiaturę iOS via `visualViewport` API
- Threshold: 100px, zwraca `boolean`

---

## 8. Frontend — Warstwa API

### `client.js` — Base fetch

- `apiFetch(path, options)` — dodaje JWT header, obsługuje 401 (redirect → /login)
- `apiUpload(path, formData)` — multipart upload z JWT
- `parseErrorDetail()` — wyciąga `detail.msg` lub tablicę błędów
- Network error → Polish error message

### Pliki per moduł

| Plik | Funkcje |
|------|---------|
| `auth.js` | checkAuthStatus, setup, login, getMe, changePassword, completeOnboarding, resetAccount |
| `calendar.js` | getEvents(start, end), createEvent, updateEvent, deleteEvent |
| `shopping.js` | getLists, getList, createList, updateList, deleteList, addItem, updateItem, toggleItem, deleteItem, reorderItems, getCategories, createCategory, saveListAsExpense |
| `expenses.js` | getExpenses(filters), createExpense, updateExpense, deleteExpense, getExpenseCategories, createExpenseCategory, getMembers, createMember, updateMember, deleteMember, getRecurring, createRecurring, updateRecurring, deleteRecurring, generateRecurring, getBudget, setBudget, getSummary, getComparison |
| `plans.js` | getPlansSummary, getGoals, getGoal, createGoal, updateGoal, deleteGoal, addMilestone, updateMilestone, toggleMilestone, deleteMilestone, getBucketItems, createBucketItem, updateBucketItem, deleteBucketItem, toggleBucketItem |
| `voice.js` | processVoiceCommand(audioBlob, chatHistory, fileExt), executeVoiceAction(action) — z resolveStartEnd() dla normalizacji dat |

---

## 9. Frontend — Utilities

### `soundManager.js` — Audio pool z microtask batching

| Dźwięk | Plik | Priorytet |
|--------|------|-----------|
| sparksGained | zdobycie-iskier.mp3 | 2 |
| voiceStart | start-nagrywania-glosu.mp3 | 5 |
| voiceStop | stop-nagrywania-glosu.mp3 | 5 |
| taskComplete | ukonczenie-zadania.mp3 | 6 |
| goalAdded | dodanie-celu.mp3 | 6 |
| expenseAdded | dodano-wydatek.mp3 | 6 |
| affirmationOpen | otwarcie-afirmacji.mp3 | 7 |
| achievementUnlocked | odblokowanie-osiagniecia.mp3 | 8 |
| levelUp | nowy-poziom.mp3 | 9 |

- Audio Pool: 3 instancje `HTMLAudioElement` per dźwięk (overlapping playback)
- Microtask batching: wiele dźwięków w jednym sync bloku → gra tylko najwyższy priorytet
- `preloadSounds()` na starcie aplikacji
- Settings z localStorage (`smartme_sound_settings`)
- Fire-and-forget: błędy cicho ignorowane

### `rewardEngine.js` — Sparki/levele/streaki

- 30 poziomów predefiniowanych (40→60→80... sparks), potem +150/level
- `calculateLevel(totalSparks)` → `{level, xp, xpToNextLevel}`
- Streak bonusy: Phase 1 (dni 1-10: +5/dzień), Phase 2 (11-30: +18 co 2 dni), Phase 3 (31+: +25 co 3 dni)
- Super streak: 10/20/30 dni → +50 sparks
- Daily reset: per-calendar-day spark caps
- Action rewards: affirmation(5), expense_added(2), goal_created(5)
- Cooldowns: affirmation (6h)

### `achievementEngine.js` — 17 osiągnięć

- 3 kategorie: selfcare, finance, growth
- 3 tiers: small(20 sparks), medium(40), large(80)
- Condition checks per achievement
- 6 level milestones (levels: 3, 5, 10, 15, 20, 25, 30, 50)
- Feature unlocks: affirmationAnimations, cloudThemes

### `challengeEngine.js` — Wyzwania

- DAILY_POOL: 6 szablonów (affirmation×2, expense×2, goal_create, goal_complete)
- WEEKLY_POOL: 8 szablonów (te same typy, wyższe cele)
- Seeded random generation per dzień/tydzień
- Bonus: all-daily, all-weekly completion sparks
- Active day tracking dla weekly active_day challenges

### `shoppingUtils.js` — Parsowanie i kategoryzacja

- `parseItemInput("2 kg ziemniaki")` → `{quantity: 2, unit: "kg", name: "ziemniaki"}`
- `inferCategoryId(name, categories)` — weighted keyword matching (400+ polskich słów)
- Wagi: 3=exact match, 2=stem match, 1=ambiguous

### `reactionConfig.js` — Konfiguracja reakcji avatarów

- 4 avatary × 7 typów zdarzeń → pule wiadomości z emoji
- `REACTION_CONFIG` — per-type: cooldown, probability, bubble/label themes
- `AVATAR_REACTIONS` — pełne pule wiadomości per avatar × event type

---

## 10. Frontend — Komponenty

### Layout (4 pliki)

| Komponent | Opis |
|-----------|------|
| `AppShell` | Root layout: Sidebar + Header + Outlet + BottomNav + VoiceFab. Gradient bg + animowane bloby (sm-blob-drift-1/2) |
| `Header` | Mobile-only header z logo SmartMe i przyciskiem ustawień |
| `Sidebar` | Desktop-only nawigacja (230px), kolorowe ikony per moduł |
| `BottomNav` | Mobile-fixed bottom nav (5 pozycji), active lift + scale, hide na keyboard |

### Auth (4 pliki)

| Komponent | Opis |
|-----------|------|
| `SetupPage` | Tworzenie pierwszego konta (username, email, password) |
| `LoginPage` | Logowanie, sprawdza setup_completed |
| `OnboardingPage` | 3-krokowy onboarding: powitanie → wybór avatara → gotowe |
| `ProtectedRoute` | Guard: token + user + onboarding check |

### Kalendarz (9 plików)

| Komponent | Opis |
|-----------|------|
| `CalendarPage` | Kontener: DayDetail (góra) + MonthView (dół) + formularze |
| `CalendarHeader` | Nawigacja miesiąca (< Marzec 2026 >) |
| `MonthView` | Siatka 7×6, event bars, today highlight, selected indicator |
| `DayDetailView` | Widok dnia z swipe (50px threshold), eventy, quick-add buttony |
| `DayEventsDrawer` | Drawer z wydarzeniami dnia |
| `EventFormDrawer` | Formularz: tytuł, czas, kolor, ikona, rrule, opis |
| `EventChip` | Kompaktowa karta wydarzenia (kolor + ikona + czas) |
| `UndoRedoButtons` | Fixed bottom-center, cofnij/ponów (max 3 kroki) |
| `QuickAddEditor` | Edytor szablonów quick-add (BottomSheetDialog) |

Pomocniczo: `eventIcons.js` — mapowanie emoji ikon

### Zakupy (5 plików)

| Komponent | Opis |
|-----------|------|
| `ShoppingPage` | Lista list zakupów, tworzenie nowej, EmptyState |
| `ShoppingListDetail` | Produkty pogrupowane po kategoriach, add/edit/reorder/clear/templates |
| `ShoppingListCard` | Karta listy: nazwa, sklep, liczba produktów |
| `ShoppingItemRow` | Wiersz: checkbox, nazwa (z ilością), edit/delete/reorder |
| `NewListDialog` | Dialog tworzenia listy z szablonami |

### Wydatki (8 plików)

| Komponent | Opis |
|-----------|------|
| `ExpensesPage` | Header + miesiąc selector + tab bar (Dashboard/Lista/Budżet/Cykliczne) |
| `ExpensesList` | Lista wydatków z search, filtry, delete z undo |
| `ExpensesDashboard` | Podsumowanie: total, kategorie, trend |
| `BudgetView` | Wizualizacja budżetu per kategoria |
| `RecurringExpenses` | Lista wydatków cyklicznych |
| `AddExpenseDialog` | Formularz: kwota, opis, data, kategoria, płatnik, wspólny |
| `ExpenseUndoBar` | Toast undo dla usuniętych wydatków (scoped to Expenses screen) |
| `QuickAdd` | Szybkie dodawanie wydatków |

### Plany (7 plików)

| Komponent | Opis |
|-----------|------|
| `PlansPage` | Tab bar: Cele / Bucket Lista + summary |
| `GoalsView` | Lista celów z search + filtry (kategoria, status) |
| `GoalCard` | Karta celu: tytuł, progress bar, milestones count |
| `GoalDetail` | Pełny widok celu z listą kamieni milowych |
| `GoalFormDialog` | Tworzenie/edycja celu |
| `BucketListView` | Lista marzeń z search + filtry, pending/completed |
| `BucketItemFormDialog` | Tworzenie/edycja elementu bucket listy |

### Dashboard (14+ plików)

| Komponent | Opis |
|-----------|------|
| `DashboardPage` | Reorderable tiles: greeting, widgety, avatar, challenges |
| `DashboardGreeting` | Losowe powitanie + data + level badge |
| `RewardBar` | Level circle, sparks count, streak badge, XP progress |
| `TodayWidget` | Podsumowanie dnia |
| `GoalsWidget` | Quick goals preview |
| `BudgetWidget` | Budget preview |
| `ShoppingWidget` | Shopping preview |
| `ChallengesWidget` | Wyzwania preview (lazy) |
| `AttentionWidget` | Alerty i przypomnienia (lazy) |
| `AchievementsPage` | Gablotka: kolekcja, postęp, kategorie, level rewards |
| `ChallengesPage` | Dzienne (lavender) + tygodniowe (rose/peach) wyzwania |
| `QuickNav` | Szybka nawigacja |
| `DashboardWidgets` | Kontener widgetów |

### Common (15+ plików)

| Komponent | Opis |
|-----------|------|
| `EmptyState` | Reusable: ikona + tytuł + opis + CTA (sm-empty-enter) |
| `SmartMeLoader` | Branded three-dot loader (sm-loader-dot, color/size/label props) |
| `PageTransition` | Wrapper z sm-page-enter animacją |
| `BottomSheetDialog` | Mobile-bottom / desktop-center modal z backdrop blur |
| `ErrorBoundary` | Global error catch z refresh button |
| `SparkToast` | Portal "+N Iskier" (auto-dismiss 2.6s) |
| `AchievementToast` | Portal odznaki/challenge (auto-dismiss 3.5s) |
| `SuccessToast` / `ErrorToast` | Powiadomienia sukcesu/błędu |
| `DateTimeInput` / `DateInput` | Pickers z module accent color |
| `SmartMeLogo` | Logo (image fallback) |
| `FeedbackDialog` | Formularz opinii (bug/idea/opinion/broken) |
| `SettingsPage` | Profil, hasło, reset, dźwięki, feedback, avatar link |
| `Toaster` | Portal container |

### Affirmation / Avatary (11 plików)

| Komponent | Opis |
|-----------|------|
| `AffirmationAvatar` | Avatar z state machine (idle/happy/think/reading) + afirmacje + particles |
| `AvatarSelectionPage` | Galeria avatarów z locked/active states |
| `AvatarReaction` | Bąbelki reakcji avatara (3.5s display) |
| `AvatarThumbnail` | Miniatura avatara |
| `avatarConfig.js` | Definicje: Sol(L1), Nox(L1), Bloom(L5), Aura(L10) + selection helpers |
| `reactionConfig.js` | Pule wiadomości per avatar × event type + bubble/label themes |
| `SolSun.jsx` | SVG słońca (peach) |
| `NoxMoon.jsx` | SVG księżyca (lavender) |
| `BloomFlower.jsx` | SVG kwiatka (pink) |
| `AuraOrb.jsx` | SVG kuli (lavender) |
| `shared.jsx` | HeartSvg, StarSvg, shared particle utils |

### Voice (2 pliki)

| Komponent | Opis |
|-----------|------|
| `VoiceFab` | Floating mic button: idle/recording/processing states |
| `VoiceConfirmationDialog` | Potwierdzenie + edycja komendy głosowej |

### Celebration (1 plik)

| Komponent | Opis |
|-----------|------|
| `CelebrationOverlay` | Imperative particle + glow engine (RAF-based), safety timeout 5s |

---

## 11. System Nagród SmartMe

Cały system działa **client-side** (Zustand + localStorage). Brak backendu.

### Architektura

```
User Action
  ├─▶ useRewards.reward(action)     → sparks + level + streak
  ├─▶ useAchievements.trackProgress → odznaki
  ├─▶ useChallenges.trackAction     → wyzwania
  └─▶ useCelebration.celebrate      → cząsteczki
       └─▶ useAvatarReaction.react  → bąbelek avatara
```

### Sparki i Levele

| Akcja | Sparki | Limit |
|-------|--------|-------|
| affirmation | 5 | cooldown 6h |
| expense_added | 2 | daily cap 10 |
| goal_created | 5 | 1/dzień |

- 30 poziomów predefiniowanych (40→60→80... sparks), potem +150/level
- Streak bonusy: Phase 1 (+5/dzień), Phase 2 (+18 co 2 dni), Phase 3 (+25 co 3 dni)
- Super streak: 10/20/30 dni → +50 sparks

### Osiągnięcia (17 total)

Kategorie: selfcare, finance, growth

| Tier | Sparki |
|------|--------|
| small | 20 |
| medium | 40 |
| large | 80 |

Przykłady: seven_day_streak, first_expense, fifty_expenses, ten_goals, goals_completed_20

### Level Milestones (7)

| Level | Nagroda |
|-------|---------|
| 3 | Hearts animation |
| 5 | Avatar Bloom + sunrise theme |
| 10 | Avatar Aura + badge |
| 15 | Premium affirmations |

Feature unlocks: affirmationAnimations, cloudThemes

### Wyzwania

- **Dzienne**: 3 losowe z puli 6, seeded random per dzień
- **Tygodniowe**: 3 losowe z puli 8, seeded random per tydzień
- **Bonus**: all-daily completion, all-weekly completion → dodatkowe sparki
- **Typy**: affirmation, expense, goal_create, goal_complete, active_day

### Celebracje

| Typ | Cząsteczki | Czas | Cooldown | Priorytet |
|-----|-----------|------|----------|-----------|
| progress | 3 tiny | 500ms | 3s | 0 |
| affirmation | 6 soft | 800ms | 2s | 1 |
| reward | 10 burst | 1000ms | 1.5s | 2 |
| achievement | 14 halo | 1200ms | 0 | 3 |
| levelup | 20 full | 1500ms | 0 | 4 |

Wyższy priorytet zastępuje niższy w trakcie animacji.

### Toasty

| Toast | Pozycja | Czas | Styl |
|-------|---------|------|------|
| SparkToast | top center | 2.6s | pill, gradient na level-up |
| AchievementToast | top center | 3.5s | gradient card, particle emoji |

### localStorage keys

| Store | Key |
|-------|-----|
| Auth token | `token` |
| Rewards | `smartme_rewards` |
| Achievements | `smartme_achievements` |
| Challenges | `smartme_challenges` |
| Avatar | `smartme_avatar` |
| Avatar Unlocks | `smartme_seen_avatar_unlocks` |
| Sound Settings | `smartme_sound_settings` |
| Quick Templates | `anelka_quick_templates` |
| Shopping Templates | `anelka_shopping_templates` |
| Item History | `anelka_item_history` |

---

## 12. System Animacji (Motion)

### Centralna konfiguracja: `config/motionConfig.js`

Single source of truth dla:
- `EASING` — out (signature: `cubic-bezier(0.22, 1, 0.36, 1)`), standard, bounce, linear
- `DURATION` — micro(150), fast(200), toast(350), tab(420), page(620), activate(900)
- `Z` — z-index map (patrz tabela niżej)
- `CELEBRATION_TYPES` — count, duration, glow, spread, size, opacity per type
- `CELEBRATION_PALETTES` — RGBA kolory per type (5 palet)
- `CELEBRATION_PRIORITY` / `CELEBRATION_COOLDOWNS`
- `MICRO` — presets: button press, item add, complete, pop, shake
- `MODULE_THEME` — per-module accent + glow (dashboard, calendar, shopping, expenses, plans, chores)
- `AMBIENT` — blob drift config (25s, 12px, scale 0.97–1.03)
- `PARTICLE_SAFETY_TIMEOUT` — 5000ms

### CSS klasy: `styles/motion.css`

| Klasa | Keyframe | Czas | Zastosowanie |
|-------|----------|------|-------------|
| `sm-page-enter` | translateY(6px) → 0 | 620ms | Zmiana stron/tabów |
| `sm-fade-in` | blur(3px) + translateY(4px) → 0 | 420ms | Zmiana treści |
| `sm-card-enter` | translateY(4px) → 0 | 200ms | Pojawianie kart |
| `sm-slide-right` | translateX(12px) → 0 | 620ms | Widoki szczegółów |
| `sm-expand-in` | scaleY(0.97) → 1 | 180ms | Akordeony |
| `sm-complete` | bounce scale | 350ms | Checkbox ukończenia |
| `sm-add` | pop + float | 300ms | Dodanie elementu |
| `sm-pop` | scale bounce | 400ms | Nagroda |
| `sm-shake` | x-axis shake | 400ms | Błąd walidacji |
| `sm-empty-enter` | float-up | 600ms | Pusty stan |
| `sm-breathe` | scale pulse | 4s ∞ | Dekoracja |
| `sm-blob-drift-1` | drift | 25s ∞ | Background blob |
| `sm-blob-drift-2` | drift | 30s ∞ | Background blob |
| `sm-loader-dot` | breathing | 1.4s | Three-dot loader |
| `dashFadeIn` | staggered translateY(12px) | — | Dashboard entry |

- GPU-only: opacity, transform, filter (no layout reflows)
- `prefers-reduced-motion`: wyłącza wszystkie animacje

### Z-index Map

| Warstwa | Wartość |
|---------|---------|
| background | 0 |
| content | 1 |
| stickyControls | 10 |
| bottomNav | 200 |
| undoBar | 250 |
| voiceFab | 300 |
| dialogBackdrop | 400 |
| dialogContent | 401 |
| affirmationOverlay | 450 |
| toast | 500 |
| celebrationGlow | 599 |
| celebrationParticle | 600 |

### Dialog System (motion.css)

- `.sm-dialog-backdrop` — blur(3px) backdrop z fade
- `.sm-dialog-container` — mobile bottom-sheet, desktop centered
- `.sm-dialog-content` — slide-up + scale entry
- `data-kbd-open` — iOS keyboard safety adjustment
- z-index: 400 (backdrop), 401 (content)

### CelebrationOverlay — Particle Engine

- Imperatywny DOM (nie CSS) — `requestAnimationFrame` loop
- `createParticle()`: fixed div, easing `1-(1-p)^4`, radial burst z jitter
- `createGlow()`: radial-gradient div, scale 0.2→1.5
- Mobile: połowa cząsteczek, brak glow
- Safety: `activeElements` Set, per-particle timeout 5s, `cleanupAllParticles()` na unmount
- `prefers-reduced-motion`: wyłącza wszystko

### Micro-feedback hook

- `useMicroFeedback()` — imperative `classList` manipulation (zero re-renders)
- `trigger(animClass, targetEl)` — dodaje klasę, auto-remove po `animationend`
- Safety timeout 1s

---

## 13. System Dźwięków

Plik: `utils/soundManager.js`

| Dźwięk | Plik | Priorytet |
|--------|------|-----------|
| sparksGained | zdobycie-iskier.mp3 | 2 |
| voiceStart | start-nagrywania-glosu.mp3 | 5 |
| voiceStop | stop-nagrywania-glosu.mp3 | 5 |
| taskComplete | ukonczenie-zadania.mp3 | 6 |
| goalAdded | dodanie-celu.mp3 | 6 |
| expenseAdded | dodano-wydatek.mp3 | 6 |
| affirmationOpen | otwarcie-afirmacji.mp3 | 7 |
| achievementUnlocked | odblokowanie-osiagniecia.mp3 | 8 |
| levelUp | nowy-poziom.mp3 | 9 |

### Kluczowe cechy

- **Audio Pool**: 3 instancje `HTMLAudioElement` per dźwięk (overlapping playback)
- **Microtask batching**: Jeśli wiele dźwięków w jednym sync bloku (np. akcja + reward + achievement), gra tylko najwyższy priorytet
- **Preload**: `preloadSounds()` na starcie aplikacji (App.jsx)
- **Volume/Enabled**: Z localStorage (`smartme_sound_settings`)
- **Fire-and-forget**: Błędy cicho ignorowane

---

## 14. System Avatarów i Afirmacji

### Dostępne avatary

| Avatar | Key | Level | Motyw | Ikona | Osobowość |
|--------|-----|-------|-------|-------|-----------|
| Sol | sol | 1 | peach | ☀️ | Ciepły, energiczny, motywujący |
| Nox | nox | 1 | lavender | 🌙 | Spokojny, uziemiający, kojący |
| Bloom | bloom | 5 | pink | 🌸 | Wzrostowy, opiekuńczy, nastawiony na rozwój |
| Aura | aura | 10 | lavender | 🔮 | Refleksyjny, elegancki, empowering |

### Reakcje avatara

Każdy avatar ma unikalne wiadomości na 5 typów zdarzeń:

| Typ zdarzenia | Probability | Cooldown |
|---------------|-------------|----------|
| affirmation_reveal | 0.3 | 15min |
| goal_completed | 0.8 | 5min |
| streak_milestone | 1.0 | brak |
| level_up | 1.0 | brak |
| avatar_unlocked | 1.0 | brak |

**Limity**: Max 20 reakcji per sesja, display 3.5s

### AffirmationAvatar — State machine

Stany: idle → happy → think → reading
- Każdy avatar ma dedykowane SVG komponenty
- Particles system (HeartSvg, StarSvg) na interakcji
- Bubble/label themes per avatar (gradient bg, kolor tekstu, ogonka)

### Bubble Themes

Każdy avatar ma własny gradient bg, kolor ogonka i tekstu dla bąbelków reakcji.

---

## 15. Komendy Głosowe

### Flow

```
1. Nagrywanie audio (MediaRecorder, max 60s)
   Format auto-detection: webm/opus → ogg → mp4/aac (iOS fallback)
2. POST /api/voice/process (multipart: audio + chatHistory)
   → Whisper transkrypcja (pl)
   → GPT-4o-mini parsowanie intencji (JSON)
   → Walidacja dat kalendarza (calendar_validator.py)
3. Wyświetlenie proponowanych akcji (VoiceConfirmationDialog)
4. Potwierdzenie/edycja użytkownika
5. POST /api/voice/execute → wykonanie przez executor
```

### Backend: Executors (5 modułów)

| Executor | Akcje |
|----------|-------|
| `calendar_executor` | add_event, update_event, delete_event, delete_all_events, list_events |
| `shopping_executor` | create_shopping_list, add_shopping_items, delete_shopping_items, check/uncheck_items |
| `expense_executor` | add_expense, add_recurring_expense, delete_recurring_expense, set_budget, list_expenses, generate_recurring, save_shopping_as_expense |
| `plans_executor` | add_goal, update_goal, delete_goal, toggle_goal, add_bucket_item, delete_bucket_item, toggle_bucket_item, list_goals |
| `calendar_validator` | walidacja dat i RRULE |

### Formaty audio

webm (opus), mp3, wav, ogg, m4a, mp4 (iOS). Max 10MB.

### Interpretacja temporalna

- Typy: single_date, explicit_dates, date_range, weekday_recurring, interval_recurring, duration_span
- Backend waliduje: wyklucza przeszłe daty, buduje RRULE
- Chat history: ostatnie 10 par (20 wpisów) jako kontekst GPT

### Frontend: voice.js

- `processVoiceCommand(audioBlob, chatHistory, fileExt)` — POST multipart
- `executeVoiceAction(action)` — POST JSON z resolveStartEnd() dla normalizacji dat
- Payload mapping per moduł (calendar, shopping, expenses, plans)

---

## 16. Design System

### Styl wizualny

Miękki, ciepły, kobiecy, spokojny, premium. Pastelowa paleta.

### Paleta kolorów (theme.js)

| Token | Zakres | Opis |
|-------|--------|------|
| rose | #FFF0F7 → #8C1941 | Fuksja-różowy |
| peach | #FFF4ED → #7D3118 | Koral-morelowy |
| sage | #E6FCF5 → #087F5B | Teal-miętowy |
| sky | #E7F5FF → #1864AB | Periwinkle-niebieski |
| lavender | #F3F0FF → #5F3DC4 | Fioletowy |

### Kolory modułów

| Moduł | Kolor | Primary | Hover | Chip aktywny | Chip nieaktywny |
|-------|-------|---------|-------|--------------|-----------------|
| Dashboard/Plans | rose | rose.300 | rose.400 | rose.300 | rose.50 |
| Calendar | sky | sky.400 | sky.500 | sky.400 | sky.50 |
| Shopping | sage | sage.400 | sage.500 | sage.500 | sage.50 |
| Expenses | peach | peach.400 | peach.500 | peach.400 | peach.50 |
| Challenges | lavender | lavender.400 | lavender.500 | lavender.500 | lavender.50 |
| Rewards | gradient | #FCC2D7→#F9915E | — | rose.400 | rose.50 |

### Semantic tokens

| Token | Wartość | Opis |
|-------|---------|------|
| bg.DEFAULT | #FBF8F9 | Ciepły beżowy tło |
| textPrimary | #3B4A63 | Ciepły niebiesko-szary |
| textSecondary | #5A6B82 | Średni szary |
| textTertiary | #8294AA | Jasny szary |

### Fonty

- Heading: Nunito, Inter, sans-serif
- Body: Inter, sans-serif

### Karty

```
bg="white"
borderRadius="2xl"
shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
borderWidth="1px"
borderColor="gray.100"
px={4} py={4}  (kompaktowe wiersze: p={3.5})
```

- Hover: `shadow="0 2px 12px 0 rgba(...)` z kolorem modułu, `borderColor` modułu `.300`
- NIE używaj `shadow="xs"`, `border="1px solid"`, ani `borderRadius="xl"` na kartach

### Elementy UI

- **Search input**: `borderRadius="xl"`, border modułu `.200`, focus `.400`
- **Tab bar**: pill-bar (`bg="moduł.50"`, `borderRadius="xl"`, `p="3px"`), aktywna = `bg="white"` + `shadow="sm"`
- **Item rows**: `borderRadius="xl"` (nie "lg")
- **Dialogi**: `BottomSheetDialog` — mobile bottom-sheet / desktop centered, `borderRadius="2xl"`, `shadow="xl"`, backdrop blur
- **Empty states**: `EmptyState` component — ikona modułu `.300`, circle bg `.50`, ciepły tekst
- **Loading**: `SmartMeLoader` — three-dot breathing (color prop per moduł)

---

## 17. Bezpieczeństwo

### Autentykacja

- JWT (HS256), token expiry 30 dni (konfigurowalny przez `ACCESS_TOKEN_EXPIRE_DAYS`)
- Single-user: pierwszy zarejestrowany = właściciel, setup zablokowany po tym
- Bcrypt hashing hasła (passlib + bcrypt)
- **Prod safety**: SECRET_KEY raises RuntimeError jeśli jest domyślna wartość dev

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/api/auth/setup` | 3/min |
| `/api/auth/login` | 5/min |
| `/api/auth/change-password` | 5/min |
| `/api/feedback` | 5/min |

In-memory sliding window per IP (nie distributed).

### Security Headers (Nginx)

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`

### CORS

Konfigurowalny przez env `CORS_ORIGINS` (lista origins oddzielona przecinkami).
- Dev: `http://localhost:81, http://localhost:3001`
- Prod: `https://smartme.rafaldebski.com`

### Kompresja

GZip na backendzie (FastAPI middleware, min 500B) + nginx (gzip level 4, min 256B).

### Error Handling

- Backend: global exception handler → 500 z polskim komunikatem, log do stdout
- Frontend: ErrorBoundary (global catch) + ErrorToast (zustand store)
- API: 401 → redirect /login, network error → Polish error messages

---

## 18. Deploy i Produkcja

### Infrastruktura

| Element | Wartość |
|---------|---------|
| VPS | Hetzner CX23, Ubuntu |
| IP | 89.167.123.192 |
| Domena | smartme.rafaldebski.com |
| SSL | Let's Encrypt (ważny do 2026-06-08) |
| SSH | `ssh root@89.167.123.192` (klucz ed25519) |
| Pliki | `/root/anelka/` |

### Różnice prod vs dev

| | Dev | Prod |
|---|---|---|
| Compose | docker-compose.yml | docker-compose.prod.yml |
| Frontend | Vite dev server (HMR) | Static build (nginx) |
| Frontend Dockerfile | Dockerfile | Dockerfile.prod (multi-stage) |
| Nginx config | nginx.conf | nginx.prod.conf (SSL, HSTS) |
| Porty | 81, 8001, 3001, 5433 | 80, 443 (SSL) |
| CORS | localhost | https://smartme.rafaldebski.com |
| SSL | Brak | Let's Encrypt + HSTS |

### Procedura deploy

```bash
# 1. Push plików na serwer
tar --exclude='node_modules' --exclude='.git' --exclude='__pycache__' \
    --exclude='*.pyc' --exclude='.env' --exclude='pgdata' -czf - . | \
    ssh root@89.167.123.192 "cd /root/anelka && tar xzf -"

# 2. Rebuild + restart
ssh root@89.167.123.192 'cd /root/anelka && docker compose -f docker-compose.prod.yml up --build -d'

# 3. Poczekaj na migracje + restart nginx
ssh root@89.167.123.192 'sleep 15 && docker restart anelka-nginx'

# 4. Weryfikacja
ssh root@89.167.123.192 'curl -s https://smartme.rafaldebski.com/api/health'
# → {"status":"ok","database":"ok"}
```

### Odnawianie certyfikatu SSL

```bash
ssh root@89.167.123.192 'cd /root/anelka && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker restart anelka-nginx'
```

### UWAGA

- **NIE nadpisuj** `/root/anelka/.env` na serwerze — zawiera unikalne hasła
- Lokalny `.env` jest wyłączony z tar (`--exclude='.env'`)

---

## 19. Komendy Developerskie

```bash
# Start (z katalogu anelka)
docker-compose up --build -d

# Logi
docker logs anelka-backend --tail 30
docker logs anelka-frontend --tail 30

# Restart backendu
docker restart anelka-backend

# Nowa migracja
docker exec anelka-backend alembic revision --autogenerate -m "opis"
docker exec anelka-backend alembic upgrade head

# Logi produkcyjne
ssh root@89.167.123.192 'docker logs anelka-backend --tail 30'
ssh root@89.167.123.192 'docker logs anelka-nginx --tail 30'
```

---

## 20. Fazy Implementacji

| Faza | Opis | Status |
|------|------|--------|
| 0 | Fundament (auth, layout, routing, Alembic) | ✅ |
| 1 | Obowiązki (chores + household_members) | ⬜ |
| 2 | Zakupy (shopping lists + categories + items) | ✅ |
| 3 | Kalendarz (events + recurrence + undo/redo + quick-add + duplikaty) | ✅ |
| 4 | Wydatki (expenses + categories + summary + recurring + budget) | ✅ |
| 5 | OCR paragonów (Tesseract) | ⬜ |
| 6 | Plany (goals, milestones, bucket list) | ✅ |
| 7 | Push Notifications (VAPID, service worker) | ⬜ |
| 8 | AI (OpenAI, sugestie, chat) | ⬜ |
| 9 | Polish (Google Calendar, PWA, streaming AI) | ⬜ |
| R | SmartMe Rewards (sparks, levels, achievements, challenges, celebrations, avatars) | ✅ |
| M | Motion System (motionConfig, micro-feedback, ambient animations, branded loader/empty states) | ✅ |

### Przygotowane puste moduły (backend)

- `app/notifications/` — push notifications (pywebpush zainstalowany)
- `app/ai/` — AI features (openai zainstalowany)

---

## Struktura plików

```
anelka/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + middleware + routers
│   │   ├── config.py            # Settings (env vars)
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── auth/                # JWT auth (models, router, schemas, security, dependencies, rate_limit)
│   │   ├── calendar/            # Events (models, router, schemas, service)
│   │   ├── shopping/            # Lists + items (models, router, schemas)
│   │   ├── expenses/            # Expenses + budget (models, router, schemas)
│   │   ├── plans/               # Goals + bucket (models, router, schemas)
│   │   ├── feedback/            # Feedback (models, router, schemas)
│   │   ├── voice/               # Voice commands (router, schemas, service, prompts, executor, *_executor, calendar_validator)
│   │   ├── common/              # TimestampMixin, pagination
│   │   ├── notifications/       # (puste — przyszłe push notifications)
│   │   └── ai/                  # (puste — przyszłe AI features)
│   ├── alembic/                 # DB migrations (16 plików)
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Router + Providers + Global overlays (lazy)
│   │   ├── main.jsx             # Entry point (StrictMode)
│   │   ├── theme.js             # Chakra UI v3 color tokens + semantic tokens
│   │   ├── api/                 # client.js + pliki per moduł (auth, calendar, shopping, expenses, plans, voice)
│   │   ├── hooks/               # 19 hooków: 12 zustand + 4 TanStack Query + 2 React + 1 micro-feedback
│   │   ├── utils/               # soundManager, rewardEngine, achievementEngine, challengeEngine, shoppingUtils, reactionConfig
│   │   ├── config/              # motionConfig.js
│   │   ├── styles/              # motion.css
│   │   └── components/
│   │       ├── layout/          # AppShell, Header, Sidebar, BottomNav
│   │       ├── auth/            # Setup, Login, Onboarding, ProtectedRoute
│   │       ├── calendar/        # CalendarPage, MonthView, DayDetail, EventForm, QuickAdd + 4 more
│   │       ├── shopping/        # ShoppingPage, ListDetail, ItemRow, NewListDialog + 1
│   │       ├── expenses/        # ExpensesPage, Dashboard, Budget, Recurring, QuickAdd + 3
│   │       ├── plans/           # PlansPage, Goals, BucketList + 4
│   │       ├── dashboard/       # DashboardPage, Widgets, Achievements, Challenges + 10
│   │       ├── common/          # EmptyState, Loader, Toasts, Dialogs, Settings + 10
│   │       ├── affirmation/     # Avatar system (4 SVG avatars, config, reactions) + 7
│   │       ├── voice/           # VoiceFab, ConfirmationDialog
│   │       └── celebration/     # CelebrationOverlay (particle engine)
│   ├── public/sounds/           # 9 plików audio (polskie nazwy)
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile               # Dev
│   └── Dockerfile.prod          # Prod (multi-stage build)
├── nginx/
│   ├── nginx.conf               # Dev config
│   └── nginx.prod.conf          # Prod config (SSL, HSTS)
├── docker-compose.yml           # Dev
├── docker-compose.prod.yml      # Prod
├── .env                         # Environment (dev)
├── CLAUDE.md                    # Instrukcje dla Claude
└── DOKUMENTACJA.md              # Ta dokumentacja
```

---

> Dokumentacja wygenerowana 2026-03-12. Wersja aplikacji: SmartMe v1.0 (Fazy 0–6 + R + M).
