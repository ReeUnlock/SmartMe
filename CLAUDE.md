# Anelka — Instrukcje dla Claude

## Projekt
Personalny hub zarządzania życiem dla jednej kobiety. Mobile-first, ciepłe pastele, UI po polsku.

## Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL 16, Alembic
- **Frontend**: React 19, Vite 6, Chakra UI v3, React Router v7, TanStack Query v5, zustand v5
- **Infra**: Docker Compose (db, backend, frontend, nginx)
- **AI**: OpenAI API (GPT) — dodawane stopniowo
- **OCR**: Tesseract (lokalnie, język polski)

## Porty (inne projekty zajmują domyślne)
- DB: `5433:5432`
- Backend: `8001:8000`
- Frontend: `3001:3000`
- Nginx: `81:80`, `444:443`
- Apka dostępna pod `http://localhost:81`

## Struktura backendu
```
backend/app/
  main.py           — FastAPI app, rejestracja routerów, GZip, CORS, health check
  config.py         — Settings (env vars, CORS_ORIGINS)
  database.py       — SQLAlchemy engine (pool_pre_ping, pool_recycle), session, Base
  auth/             — JWT auth (setup, login, me)
  calendar/         — wydarzenia, recurrence (RRULE), duplikaty per dzień
  shopping/         — listy zakupów, kategorie, itemy
  expenses/         — wydatki, OCR paragonów
  chores/           — obowiązki, domownicy
  plans/            — cele, plany, bucket lista
  notifications/    — push (pywebpush, VAPID)
  ai/               — OpenAI wrapper, chat, sugestie
  common/           — TimestampMixin, pagination
backend/alembic/    — migracje DB
```

## Struktura frontendu
```
frontend/src/
  App.jsx           — Router + ChakraProvider + QueryClientProvider + ErrorBoundary
  theme.js          — pastelowa paleta kolorów
  api/              — fetch wrapper z JWT, pliki per moduł
  hooks/            — useAuth (zustand), useCalendar, useEventHistory
  components/
    layout/         — AppShell, BottomNav (mobile), Sidebar (desktop), Header
    auth/           — SetupPage, LoginPage, ProtectedRoute
    calendar/       — Kalendarz (kolor: sky/błękit)
      CalendarPage.jsx    — główna strona, sekcje: przegląd dnia + przegląd miesiąca
      CalendarHeader.jsx  — nawigacja miesiąca (< Marzec 2026 >)
      MonthView.jsx       — siatka 7x6, biała karta, zaokrąglone rogi
      DayDetailView.jsx   — widok dnia (na górze), swipe, quick-add szablony
      DayEventsDrawer.jsx — drawer z wydarzeniami dnia
      EventFormDrawer.jsx — formularz (tytuł, start, czas trwania, opis, kolor, powtarzanie)
      EventChip.jsx       — wyświetlanie pojedynczego wydarzenia
      UndoRedoButtons.jsx — cofnij/ponów (max 3 kroki, fixed center-bottom)
    shopping/       — Zakupy (kolor: sage/zieleń)
    expenses/       — Wydatki (kolor: peach/brzoskwinia)
    chores/         — Obowiązki (kolor: lavender/fiolet)
    plans/          — Plany (kolor: rose/róż)
    ai/             — AiChatDrawer, podpowiedzi
    voice/          — VoiceFab (mikrofon), VoiceConfirmationDialog
    common/         — EmptyState, LoadingSpinner, SettingsPage, ErrorBoundary
```

## Routing (polskie ścieżki)
```
/setup             — pierwsze uruchomienie (tworzenie konta)
/login             — logowanie
/kalendarz         — kalendarz
/zakupy            — listy zakupów
/wydatki           — śledzenie wydatków
/obowiazki         — obowiązki domowe
/plany             — cele i plany
/ustawienia        — ustawienia
```

## API
Wszystkie endpointy pod `/api/`. Wymagają JWT oprócz `/api/auth/setup`, `/api/auth/login`, `/api/auth/status`, `/api/health`.

## Kalendarz — szczegóły implementacji
- **Layout**: przegląd dnia (u góry) → przegląd miesiąca (pod spodem), każda sekcja z bannerem i ramką
- **Quick-add szablony**: Szpital, Klinika, Dzieci, Dyżur, Zejście, Wolne — z predefiniowanymi godzinami/kolorami
- **Duplikaty**: backend blokuje 409 jeśli ten sam `title` już istnieje w danym dniu; frontend wyszarza quick-add buttony
- **Undo/Redo**: zustand store (`useEventHistory`), max 3 kroki wstecz, cofnij create=delete, cofnij delete=recreate, cofnij update=restore
- **Formularz**: tytuł, data+godzina, czas trwania (dropdown 30min-24h), opis, kolor (8 opcji), powtarzanie (RRULE)
- **Usunięte z formularza**: toggle "cały dzień", data zakończenia (zastąpiona czasem trwania), kategoria, miejsce
- **Kolory cyfr**: dni powszednie `#2B5EA7` (ciemny niebieski), weekendy `rose.400`, dziś = białe w kółku `sky.400`
- **Vite HMR**: wymaga `usePolling: true` w Docker na Windows

## Konwencje
- **Język UI**: polski (wszystkie teksty, komunikaty, placeholdery)
- **Język kodu**: angielski (nazwy zmiennych, funkcji, klas, plików)
- **Polskie znaki w JSX**: ZAWSZE opakowuj w wyrażenia JS `{"tekst z polskimi znakami"}`, NIE wstawiaj `\uXXXX` w surowym tekście JSX — będzie wyświetlony dosłownie
- **Auth**: single-user, pierwszy zarejestrowany = właściciel, potem setup zablokowany
- **Domownicy**: tylko imiona/etykiety (nie osobne konta), 2 osoby
- **Migracje**: Alembic (nie `Base.metadata.create_all`), auto-uruchamiane przy starcie kontenera
- **Nowe modele**: dodaj import w `alembic/env.py` + stwórz migrację + dodaj `Index` na `user_id` i FK
- **Indeksy DB**: każda tabela ma `Index` na `user_id` i kluczowych kolumnach zapytań (date, start_at, list_id, goal_id)
- **Style**: Chakra UI v3, custom tokens w theme.js, każdy moduł ma swój kolor
- **State**: zustand dla auth/UI/eventHistory, TanStack Query dla server state
- **Porty zajęte**: jeśli port jest zajęty, automatycznie wybierz inny bez pytania
- **Docker HMR (Windows)**: Vite wymaga `usePolling: true` w `vite.config.js` → `server.watch`
- **CORS**: konfigurowalne przez env var `CORS_ORIGINS` (lista origins oddzielona przecinkami)
- **Health check**: `/api/health` weryfikuje połączenie z DB, zwraca 503 gdy baza niedostępna
- **ErrorBoundary**: globalny komponent w App.jsx łapie nieoczekiwane błędy React
- **Caching**: kategorie i members mają `staleTime: 5min`, reszta 30s (domyślne)
- **Kompresja**: GZip na backendzie (FastAPI) + nginx (gzip on)
- **Security headers**: nginx dodaje X-Content-Type-Options, X-Frame-Options, Referrer-Policy

## Fazy implementacji
- [x] Faza 0: Fundament (auth, layout, routing, Alembic)
- [ ] Faza 1: Obowiązki (chores + household_members)
- [x] Faza 2: Zakupy (shopping lists + categories + items)
- [x] Faza 3: Kalendarz (events + recurrence + undo/redo + quick-add + duplikaty)
- [x] Faza 4: Wydatki (expenses + categories + summary + recurring + budget)
- [ ] Faza 5: OCR paragonów (Tesseract)
- [x] Faza 6: Plany (goals, milestones, bucket list)
- [ ] Faza 7: Push Notifications (VAPID, service worker)
- [ ] Faza 8: AI (OpenAI, sugestie, chat)
- [ ] Faza 9: Polish (Google Calendar, PWA, streaming AI)

## Komendy
```bash
# Start (z katalogu anelka)
docker-compose up --build -d

# Logi
docker logs anelka-backend --tail 30
docker logs anelka-frontend --tail 30

# Restart backendu po zmianach w kodzie (hot-reload powinien działać)
docker restart anelka-backend

# Nowa migracja (wewnątrz kontenera)
docker exec anelka-backend alembic revision --autogenerate -m "opis"
docker exec anelka-backend alembic upgrade head
```
