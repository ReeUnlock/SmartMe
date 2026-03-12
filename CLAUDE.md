# Anelka (SmartMe) — Instrukcje dla Claude

## Projekt
Personalny hub zarządzania życiem dla jednej kobiety. Mobile-first, ciepłe pastele, UI po polsku.
Domena produkcyjna: `www.smartme.life`

## Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL 16, Alembic
- **Frontend**: React 19, Vite 6, Chakra UI v3, React Router v7, TanStack Query v5, zustand v5
- **Mobile**: Capacitor 8 (Android + iOS), app id: `com.rafaldebski.smartme`
- **Infra**: Docker Compose (db, backend, frontend, nginx)
- **CI/CD**: GitHub Actions (build + Android APK + iOS validation)
- **AI**: OpenAI API (Whisper transkrypcja + GPT-4o-mini parsowanie intencji)
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
  database.py       — SQLAlchemy engine (pool_pre_ping, pool_recycle=1800, pool_size=5), session, Base
  auth/             — JWT auth (setup, login, me, change-password, complete-onboarding, reset)
  calendar/         — wydarzenia, recurrence (RRULE via dateutil), duplikaty per dzień, service.py (expand_events)
  shopping/         — listy zakupów, kategorie, itemy, toggle, reorder, to-expense (smart category split)
  expenses/         — wydatki, kategorie, domownicy, cykliczne, budżet, summary, comparison
  plans/            — cele (manual/savings/spending_limit), milestones, bucket lista
  feedback/         — anonimowy feedback (bug/idea/opinion/broken)
  voice/            — transkrypcja (Whisper) + parsowanie intencji (GPT) + executors + calendar_validator + prompts.py
  common/           — TimestampMixin, pagination
  notifications/    — (puste — przyszłe push notifications, pywebpush zainstalowany)
  ai/               — (puste — przyszłe AI features)
backend/alembic/    — migracje DB (16 plików, env.py importuje wszystkie modele)
```

## Struktura frontendu
```
frontend/src/
  App.jsx           — Router + ChakraProvider + QueryClientProvider + ErrorBoundary + Global Overlays (lazy)
  theme.js          — pastelowa paleta: rose, peach, sage, sky, lavender + semantic tokens
  api/              — client.js (apiFetch + apiUpload z JWT, VITE_API_URL env), pliki per moduł (auth, calendar, shopping, expenses, plans, voice)
  config/
    motionConfig.js   — centralna konfiguracja animacji: EASING, DURATION, Z-index, celebration presets, micro-feedback, module themes
  styles/
    motion.css        — CSS @keyframes: page transitions, micro-interactions, ambient effects, dialog system, loader
  utils/
    soundManager.js   — audio pool (3 instancje/dźwięk), microtask batching, priority system
    rewardEngine.js   — calculateLevel (30 levels), processStreak, grantReward, daily reset
    achievementEngine.js — 18 achievements (3 tiers), 7 level milestones, checkAchievements
    challengeEngine.js — seeded random challenges, DAILY_POOL(7), WEEKLY_POOL(10), progress tracking
    shoppingUtils.js  — parseItemInput ("2kg ziemniaki"), inferCategoryId (400+ weighted keywords)
    reactionConfig.js — per-avatar personality pools, 7 event types, bubble/label themes
  hooks/
    useAuth.js          — zustand, single-user JWT auth, token expiry check (60s buffer)
    useCalendar.js      — TanStack Query, events CRUD + useEventHistory integration
    useEventHistory.js  — zustand, undo/redo (max 3 kroki)
    useShopping.js      — TanStack Query, optimistic toggle, categories (staleTime 5min)
    useExpenses.js      — TanStack Query, CRUD + recurring + budget + summary + comparison
    useExpenseUndo.js   — zustand, undo stack (max 5)
    usePlans.js         — TanStack Query, goals + milestones + bucket + summary
    useRewards.js       — zustand+localStorage, sparks/level/streak, reward(action), addBonusSparks
    useAchievements.js  — zustand+localStorage, trackProgress, updateMaxStreak, checkLevelRewards
    useChallenges.js    — zustand+localStorage, sync, trackAction, claimReward, claimAllBonus
    useCelebration.js   — zustand, celebrate(type, options), priority + throttling
    useAvatarReaction.js — zustand, react(type), probability + cooldown, session cap (20)
    useVoiceCommand.js  — zustand, MediaRecorder, startRecording/stopRecording/confirmAction
    useQuickTemplates.js — zustand+localStorage, szablony kalendarza (max 12)
    useShoppingTemplates.js — zustand+localStorage, szablony zakupów (max 20)
    useItemHistory.js   — zustand+localStorage, historia produktów (max 100, LRU)
    useSoundSettings.js — zustand+localStorage, enabled/volume
    useKeyboardOpen.js  — React hook, iOS visualViewport detection
    useMicroFeedback.js — React hook, imperative CSS class trigger (zero re-renders)
  components/
    layout/         — AppShell (gradient bg + animated blobs), BottomNav (mobile, 5 items), Sidebar (desktop), Header
    auth/           — SetupPage, LoginPage, OnboardingPage (3 steps), ProtectedRoute
    calendar/       — Kalendarz (kolor: sky/błękit)
      CalendarPage.jsx    — główna strona, sekcje: przegląd dnia + przegląd miesiąca
      CalendarHeader.jsx  — nawigacja miesiąca (< Marzec 2026 >)
      MonthView.jsx       — siatka 7x6, biała karta, zaokrąglone rogi, max 2-3 eventów per cell
      DayDetailView.jsx   — widok dnia (na górze), swipe (50px threshold), quick-add szablony
      DayEventsDrawer.jsx — drawer z wydarzeniami dnia
      EventFormDrawer.jsx — formularz (tytuł, start, czas trwania, opis, kolor, ikona, powtarzanie)
      EventChip.jsx       — wyświetlanie pojedynczego wydarzenia (all-day vs timed)
      UndoRedoButtons.jsx — cofnij/ponów (max 3 kroki, fixed center-bottom)
      QuickAddEditor.jsx  — edytor szablonów quick-add (BottomSheetDialog)
      eventIcons.js       — mapowanie emoji ikon
    shopping/       — Zakupy (kolor: sage/zieleń)
      ShoppingPage.jsx       — lista list, tworzenie, EmptyState
      ShoppingListDetail.jsx — produkty pogrupowane, add/edit/reorder/clear/save-as-expense/templates
      ShoppingListCard.jsx   — karta listy
      ShoppingItemRow.jsx    — wiersz produktu (checkbox, edit, reorder, delete)
      NewListDialog.jsx      — dialog tworzenia (z szablonami)
    expenses/       — Wydatki (kolor: peach/brzoskwinia)
      ExpensesPage.jsx       — header + month nav + tab bar (Dashboard/Lista/Budżet/Cykliczne)
      ExpensesList.jsx       — lista z search, filtry, delete z undo
      ExpensesDashboard.jsx  — summary: total, by_category, trend
      BudgetView.jsx         — budżet per kategoria
      RecurringExpenses.jsx  — wydatki cykliczne
      AddExpenseDialog.jsx   — formularz wydatku
      ExpenseUndoBar.jsx     — toast undo (scoped to Expenses screen)
      QuickAdd.jsx           — szybkie dodawanie wydatków
    plans/          — Plany (kolor: rose/róż)
      PlansPage.jsx          — tab bar: Cele / Bucket Lista
      GoalsView.jsx          — lista celów z search + filtry (kategoria, status)
      GoalCard.jsx           — karta celu z progress bar
      GoalDetail.jsx         — pełny widok z milestones
      GoalFormDialog.jsx     — formularz celu
      BucketListView.jsx     — lista marzeń
      BucketItemFormDialog.jsx — formularz bucket item
    voice/          — VoiceFab (floating mic, idle/recording/processing), VoiceConfirmationDialog
    common/
      EmptyState.jsx         — reusable: icon + title + description + CTA (sm-empty-enter animation)
      SmartMeLoader.jsx      — branded three-dot loader (sm-loader-dot, color/size/label props)
      PageTransition.jsx     — wrapper z sm-page-enter animacją
      BottomSheetDialog.jsx  — mobile-bottom / desktop-center modal + backdrop blur
      ErrorBoundary.jsx      — global error catch + refresh button
      SparkToast.jsx         — portal "+N Iskier" (2.6s, pill)
      AchievementToast.jsx   — portal odznaki/challenge (3.5s, gradient card)
      SuccessToast.jsx       — success notification
      ErrorToast.jsx         — error notification
      DateTimeInput.jsx      — date+time picker z accent color
      DateInput.jsx          — date-only picker
      SmartMeLogo.jsx        — logo (image fallback)
      FeedbackDialog.jsx     — formularz opinii
      SettingsPage.jsx       — profil, hasło, reset, dźwięki, feedback, avatar link, polityka prywatności
    affirmation/    — Avatar system
      AffirmationAvatar.jsx    — state machine (idle/happy/think/reading), afirmacje, particles
      AvatarSelectionPage.jsx  — galeria kart avatarów (locked/active)
      AvatarReaction.jsx       — bąbelki reakcji (3.5s display)
      AvatarThumbnail.jsx      — miniatura
      avatarConfig.js          — Sol(L1), Nox(L1), Bloom(L5), Aura(L10), selection helpers
      reactionConfig.js        — message pools per avatar × event type, bubble/label themes
      shared.jsx               — HeartSvg, StarSvg, particle utils
      avatars/                 — SolSun, NoxMoon, BloomFlower, AuraOrb (SVG components)
    celebration/    — CelebrationOverlay (imperative RAF particle + glow engine, safety timeout 5s)
    dashboard/
      DashboardPage.jsx          — ReorderableTiles (drag-reorder, localStorage order)
      DashboardGreeting.jsx      — random greeting + date + level badge
      RewardBar.jsx              — level circle, sparks, streak, XP bar
      TodayWidget.jsx            — today summary
      GoalsWidget.jsx            — goals preview
      BudgetWidget.jsx           — budget preview
      ShoppingWidget.jsx         — shopping preview
      ChallengesWidget.jsx       — challenges preview (lazy)
      AttentionWidget.jsx        — alerts/reminders (lazy)
      AchievementsPage.jsx       — gablotka: kolekcja, postęp, kategorie, level rewards
      ChallengesPage.jsx         — dzienne (lavender) + tygodniowe (rose/peach) wyzwania
```

## Baza danych — tabele (13)
```
users               — single-user auth (username, email, hashed_password, onboarding_completed)
events              — kalendarz (title, start_at, end_at, all_day, color, icon, rrule)
shopping_lists      — listy zakupów (name, store_name, is_completed)
shopping_categories — kategorie produktów (defaults: Owoce i warzywa, Nabiał, Pieczywo, Mięso i ryby, Napoje, Chemia, Przekąski, Inne)
shopping_items      — produkty (name, quantity, unit, is_checked, sort_order, list_id, category_id)
expense_categories  — kategorie wydatków (defaults: Jedzenie, Transport, Rozrywka, Zdrowie, Dom, Ubrania, Rachunki, Edukacja, Inne)
household_members   — domownicy (defaults: "Ja", "Partner")
expenses            — wydatki (amount, description, date, is_shared, category_id, paid_by_id, source, recurring_id)
recurring_expenses  — szablony cyklicznych (name, amount, day_of_month)
monthly_budgets     — budżet miesięczny (year, month, amount — unique per user+year+month)
goals               — cele (title, category, goal_type: manual/savings/spending_limit, target_value, linked_category_id)
milestones          — kamienie milowe (title, is_completed, goal_id CASCADE)
bucket_items        — bucket lista (title, category, is_completed, completed_date)
feedback            — anonimowy (message, category: bug/idea/opinion/broken, email, user_agent)
```

## Routing (polskie ścieżki)
```
/setup             — pierwsze uruchomienie (tworzenie konta)
/login             — logowanie
/witaj             — onboarding (welcome + avatar, tylko po pierwszym setup)
/                  — dashboard (główna strona)
/kalendarz         — kalendarz
/zakupy            — listy zakupów
/wydatki           — śledzenie wydatków
/obowiazki         — obowiązki domowe (nie zaimplementowane)
/plany             — cele i plany
/ustawienia        — ustawienia
/odznaki           — Gablotka (osiągnięcia)
/wyzwania          — Wyzwania (daily/weekly challenges)
/postacie          — Kolekcja postaci afirmacji
```

## API
Wszystkie endpointy pod `/api/`. Wymagają JWT oprócz `/api/auth/setup`, `/api/auth/login`, `/api/auth/status`, `/api/health`, `/api/feedback`.

### Kluczowa logika biznesowa
- **Duplikaty kalendarza**: backend 409 jeśli ten sam `title` w danym dniu; frontend wyszarza quick-add buttony
- **RRULE**: `expand_events()` rozwija wydarzenia cykliczne w zakresie dat (max 365 dni do przodu)
- **Zakupy → Wydatki**: `POST /shopping/lists/{id}/to-expense` — smart category split proporcjonalnie do kategorii produktów
- **Wydatki cykliczne**: `POST /expenses/recurring/generate {year, month}` — tworzy z szablonów, nigdy nie duplikuje
- **Spending limit goals**: `linked_category_id` → backend oblicza `computed_expense_total` (suma wydatków w bieżącym miesiącu)
- **Summary merging**: NULL + "Inne" łączone w jeden bucket w podsumowaniach

## Kalendarz — szczegóły implementacji
- **Layout**: przegląd dnia (u góry) → przegląd miesiąca (pod spodem), każda sekcja z bannerem i ramką
- **Quick-add szablony**: Szpital, Klinika, Dzieci, Trening, Dyżur, Zejście, Wolne — konfigurowalne (QuickAddEditor)
- **Duplikaty**: backend blokuje 409 jeśli ten sam `title` już istnieje w danym dniu; frontend wyszarza quick-add buttony
- **Undo/Redo**: zustand store (`useEventHistory`), max 3 kroki wstecz, cofnij create=delete, cofnij delete=recreate, cofnij update=restore
- **Formularz**: tytuł, data+godzina, czas trwania (dropdown 30min-24h), opis, kolor (8 opcji), ikona, powtarzanie (RRULE)
- **Kolory cyfr**: dni powszednie `#2B5EA7` (ciemny niebieski), weekendy `rose.400`, dziś = białe w kółku `sky.400`
- **Swipe**: touch drag 50px threshold w DayDetailView

## Design System — Visual Consistency
Styl wizualny: miękki, ciepły, kobiecy, spokojny, premium. Dashboard i Kalendarz to referencja.

### Karty (cards)
```
bg="white"
borderRadius="2xl"
shadow="0 1px 8px 0 rgba(0,0,0,0.04)"
borderWidth="1px"
borderColor="gray.100"
px={4} py={4}  (kompaktowe wiersze: p={3.5})
```
- NIE używaj `shadow="xs"`, `border="1px solid"`, ani `borderRadius="xl"` na kartach
- Hover: `shadow="0 2px 12px 0 rgba(...)"`  z kolorem modułu, `borderColor` modułu `.300`

### Kolory modułów — przyciski i chipy
| Moduł      | Primary button | Hover      | Chip aktywny | Chip nieaktywny |
|------------|---------------|------------|--------------|-----------------|
| Shopping   | `sage.400`    | `sage.500` | `sage.500`   | `sage.50`       |
| Expenses   | `peach.400`   | `peach.500`| `peach.400`  | `peach.50`      |
| Plans      | `rose.300`    | `rose.400` | `rose.300`   | `rose.50`       |
| Calendar   | `sky.400`     | `sky.500`  | `sky.400`    | `sky.50`        |
| Challenges | `lavender.400`| `lavender.500` | `lavender.500` | `lavender.50` |
| Rewards    | gradient `#FCC2D7→#F9915E` | — | `rose.400` | `rose.50`   |

### Semantic tokens (theme.js)
- `bg.DEFAULT`: #FBF8F9 (ciepły beżowy)
- `textPrimary`: #3B4A63, `textSecondary`: #5A6B82, `textTertiary`: #8294AA
- Fonty: Heading = Nunito, Body = Inter

### Elementy UI
- **Search input**: `borderRadius="xl"`, border w kolorze modułu `.200`, focus `.400`
- **Tab bar**: pill-bar container (`bg="moduł.50"`, `borderRadius="xl"`, `p="3px"`), aktywna zakładka `bg="white"` + `shadow="sm"`
- **Empty states**: `EmptyState` component — ikona w kolorze modułu `.300`, circle bg `.50`, nagłówek + ciepły tekst
- **Loading**: `SmartMeLoader` component — three-dot breathing (color prop per moduł)
- **Item rows**: `borderRadius="xl"` (nie "lg")
- **Dialogi**: `BottomSheetDialog` — mobile bottom-sheet / desktop centered, `borderRadius="2xl"`, `shadow="xl"`, backdrop blur

## System nagród i celebracji (SmartMe)
Cały system nagród działa **client-side** (localStorage, zustand). Brak backendu.

### Architektura
```
User Action
  ├─▶ useRewards.reward(action)       → sparks + level + streak
  ├─▶ useAchievements.trackProgress   → odznaki (18 total, 3 tiers)
  ├─▶ useChallenges.trackAction       → wyzwania (3 dzienne + 3 tygodniowe)
  └─▶ useCelebration.celebrate        → cząsteczki (CelebrationOverlay)
       └─▶ useAvatarReaction.react    → bąbelek avatara (3.5s)
```

### Sparki i akcje
| Akcja | Sparki | Limit |
|-------|--------|-------|
| affirmation | 5 | cooldown 6h |
| expense_added | 2 | daily cap 10 |
| goal_created | 5 | 1/dzień |

### Celebration types (priorytet rosnąco)
| Typ | Trigger | Cząstki | Czas | Cooldown |
|-----|---------|---------|------|----------|
| `progress` | ukończenie challenge | 3 tiny | 500ms | 3s |
| `affirmation` | reveal afirmacji | 6 soft | 800ms | 2s |
| `reward` | odebranie nagrody | 10 burst | 1000ms | 1.5s |
| `achievement` | odblokowanie odznaki | 14 halo | 1200ms | 0 |
| `levelup` | nowy poziom | 20 full | 1500ms | 0 |

API: `useCelebration.getState().celebrate(type, { originX, originY, intensity })`

### Avatary
| Avatar | Key | Level | Motyw | Ikona |
|--------|-----|-------|-------|-------|
| Sol | sol | 1 | peach | ☀️ |
| Nox | nox | 1 | lavender | 🌙 |
| Bloom | bloom | 5 | pink | 🌸 |
| Aura | aura | 10 | lavender | 🔮 |

Reakcje: 7 typów zdarzeń × 4 avatary, każdy z unikalną osobowością i pulą wiadomości

### Dźwięki (soundManager.js)
- Audio pool: 3 instancje per dźwięk, microtask batching (najwyższy priorytet wygrywa w sync bloku)
- Dźwięki: taskComplete(6), goalAdded(6), expenseAdded(6), affirmationOpen(7), achievementUnlocked(8), levelUp(9), sparksGained(2), voiceStart/Stop(5)
- Settings: localStorage `smartme_sound_settings` (enabled, volume)

### localStorage keys
| Store | Key |
|-------|-----|
| Rewards | `smartme_rewards` |
| Achievements | `smartme_achievements` |
| Challenges | `smartme_challenges` |
| Avatar | `smartme_avatar` |
| Seen Unlocks | `smartme_seen_avatar_unlocks` |
| Sound | `smartme_sound_settings` |
| Quick Templates | `anelka_quick_templates` |
| Shopping Templates | `anelka_shopping_templates` |
| Item History | `anelka_item_history` |

### Gablotka (/odznaki) — layout
1. "Twoja kolekcja" (summary)
2. "Postęp kolekcji" (progress bar)
3. "Ostatnio odblokowane" (horizontal scroll)
4. Avatar widget (→ /postacie)
5. Kategorie osiągnięć (collapsed by default, multiple open)
6. Nagrody za poziom (collapsed by default)

### Wyzwania (/wyzwania) — UI
- Dzisiejsze (lavender accent) + Tygodniowe (rose/peach accent), rozdzielone gradient dividerem
- Karty challenge: column layout, icon + title + reward pill → progress bar → CTA
- 3 stany: in progress, completed (ready to claim, pulsujący progress bar), claimed (strikethrough, opacity 0.7)
- Bonus card za komplet z gradient CTA

## System animacji (Motion System)

### Centralna konfiguracja: `config/motionConfig.js`
- `EASING` — out (signature), standard, bounce, linear
- `DURATION` — micro(150ms), fast(200), toast(350), tab(420), page(620), activate(900)
- `Z` — z-index map: background(0) → content(1) → stickyControls(10) → bottomNav(200) → undoBar(250) → voiceFab(300) → dialog(400-401) → affirmation(450) → toast(500) → celebration(599-600)
- `CELEBRATION_TYPES/PALETTES/PRIORITY/COOLDOWNS` — per-type config
- `MICRO` — button press, item add, complete, pop, shake
- `MODULE_THEME` — per-module accent + glow colors
- `PARTICLE_SAFETY_TIMEOUT` — 5000ms

### CSS klasy: `styles/motion.css`
| Klasa | Animacja | Czas | Zastosowanie |
|-------|----------|------|-------------|
| `sm-page-enter` | translateY(6px) → 0 | 620ms | zmiana stron/tabów |
| `sm-fade-in` | blur(3px) + translateY(4px) → 0 | 420ms | zmiana treści wewnątrz strony |
| `sm-card-enter` | translateY(4px) → 0 | 200ms | pojawianie kart/sekcji |
| `sm-slide-right` | translateX(12px) → 0 | 620ms | widoki szczegółów |
| `sm-expand-in` | scaleY(0.97) → 1 | 180ms | akordeony, dropdown |
| `sm-complete` | bounce scale | 350ms | checkbox ukończenia |
| `sm-add` | pop + float | 300ms | dodanie elementu |
| `sm-pop` | scale bounce | 400ms | nagroda |
| `sm-shake` | x-axis shake | 400ms | błąd walidacji |
| `sm-empty-enter` | float-up | 600ms | pusty stan (EmptyState) |
| `sm-breathe` | scale pulse | 4s ∞ | dekoracja |
| `sm-blob-drift-1/2` | drift | 25-30s ∞ | background blobs (AppShell) |
| `sm-loader-dot` | breathing | 1.4s | SmartMeLoader |

- Easing: `cubic-bezier(0.22, 1, 0.36, 1)` — szybki start, miękkie lądowanie
- GPU-only: opacity, transform, filter
- `prefers-reduced-motion`: wyłącza wszystkie animacje
- Dialog system: `.sm-dialog-backdrop/container/content/actions` z iOS keyboard safety (`data-kbd-open`)

### Micro-feedback hook: `useMicroFeedback`
- Imperative `classList` manipulation (zero re-renders)
- Usage: `const {ref, trigger} = useMicroFeedback(); trigger("sm-complete", element)`
- Auto-remove po `animationend`, safety timeout 1s

### CelebrationOverlay — particle engine
- Imperative DOM (nie CSS) — `requestAnimationFrame` loop
- Mobile: połowa cząsteczek, brak glow
- Safety: `activeElements` Set, per-particle timeout 5s, `cleanupAllParticles()` na unmount

## Voice Commands
- `POST /api/voice/process` — upload audio (multipart) → transkrypcja Whisper (pl) + parsowanie intencji GPT
- `POST /api/voice/execute` — wykonanie potwierdzonej akcji
- Max audio: 10 MB, formaty: webm, mp3, wav, ogg, m4a, mp4
- Auto-stop nagrywania: 60s
- Chat history: max 10 par (kontekst GPT)
- Temporal interpretation: single_date, explicit_dates, date_range, weekday_recurring, interval_recurring, duration_span
- Obsługuje: calendar, shopping, expenses, plans (CRUD + list + toggle)

## System opinii (Feedback)
- Endpoint: `POST /api/feedback` (rate limit: 5/min, bez auth)
- Model: `message`, `category` (bug/idea/opinion/broken), `email` (opcjonalny), `user_agent`
- Tabela nie ma `user_id` — feedback anonimowy (single-user app)
- Frontend: `FeedbackDialog` w Ustawieniach

## Rate Limiting
- In-memory sliding window per IP
- `/api/auth/setup`: 3/min, `/api/auth/login`: 5/min, `/api/auth/change-password`: 5/min, `/api/feedback`: 5/min

## Konwencje
- **Język UI**: polski (wszystkie teksty, komunikaty, placeholdery)
- **Język kodu**: angielski (nazwy zmiennych, funkcji, klas, plików)
- **Polskie znaki w JSX**: ZAWSZE opakowuj w wyrażenia JS `{"tekst z polskimi znakami"}`, NIE wstawiaj `\uXXXX` w surowym tekście JSX — będzie wyświetlony dosłownie
- **Auth**: single-user, pierwszy zarejestrowany = właściciel, potem setup zablokowany
- **Domownicy**: tylko imiona/etykiety (nie osobne konta), 2 osoby domyślnie ("Ja", "Partner")
- **Migracje**: Alembic (nie `Base.metadata.create_all`), auto-uruchamiane przy starcie kontenera
- **Nowe modele**: dodaj import w `alembic/env.py` + stwórz migrację + dodaj `Index` na `user_id` i FK
- **Indeksy DB**: każda tabela ma `Index` na `user_id` i kluczowych kolumnach zapytań (date, start_at, list_id, goal_id)
- **Style**: Chakra UI v3, custom tokens w theme.js, każdy moduł ma swój kolor — patrz "Design System" wyżej
- **State**: zustand dla auth/UI/rewards/client state, TanStack Query dla server state
- **Empty states**: używaj `EmptyState` component (common/EmptyState.jsx) z ikoną i kolorem modułu
- **Loading**: używaj `SmartMeLoader` component (common/SmartMeLoader.jsx) z kolorem modułu
- **Dialogi**: używaj `BottomSheetDialog` — mobile bottom-sheet, desktop centered
- **Animacje**: tokeny z `motionConfig.js` (EASING, DURATION, Z), klasy z `motion.css`
- **Dźwięki**: `playSound(key)` z soundManager.js — microtask batching, nie trzeba się martwić o kolizje
- **Porty zajęte**: jeśli port jest zajęty, automatycznie wybierz inny bez pytania
- **Docker HMR (Windows)**: Vite wymaga `usePolling: true` w `vite.config.js` → `server.watch`
- **CORS**: konfigurowalne przez env var `CORS_ORIGINS` (lista origins oddzielona przecinkami)
- **Health check**: `/api/health` weryfikuje połączenie z DB, zwraca 503 gdy baza niedostępna
- **ErrorBoundary**: globalny komponent w App.jsx łapie nieoczekiwane błędy React
- **Caching**: kategorie i members mają `staleTime: 5min`, reszta 30s (domyślne), retry: 1
- **Mutation errors**: globalne → ErrorToast (zustand store, montowany w App.jsx)
- **Kompresja**: GZip na backendzie (FastAPI, min 500B) + nginx (gzip level 4, min 256B)
- **Security headers**: nginx dodaje X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- **Code splitting (Vite)**: vendor-react, vendor-chakra, vendor-query, vendor-utils

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
- [x] Faza R: SmartMe Rewards (sparks, levels, achievements, challenges, celebrations, avatars, affirmations)
- [x] Faza M: Motion System (motionConfig, micro-feedback, ambient animations, branded loader/empty states)
- [x] Faza S: Store Readiness (Capacitor, manifest, icons, CI/CD, privacy policy, account deletion)

## Mobile / Capacitor

### Konfiguracja
- **App ID**: `com.rafaldebski.smartme`
- **App name**: SmartMe
- **Config**: `frontend/capacitor.config.ts`
- **Web dir**: `dist` (Vite build output)
- **Android scheme**: `https` (matches production)
- **Platforms**: Android (`frontend/android/`), iOS (`frontend/ios/`)

### Struktura natywna
```
frontend/
  capacitor.config.ts       — Capacitor config (appId, plugins, server)
  .env                      — Dev (VITE_API_URL unset → "/api")
  .env.production           — Web prod (VITE_API_URL unset → "/api")
  .env.capacitor            — Native builds (VITE_API_URL=https://www.smartme.life/api)
  android/                  — Android platform (Gradle, manifesty, ikony)
  ios/                      — iOS platform (Xcode project, SPM, Info.plist)
  public/
    manifest.json           — PWA manifest
    privacy-policy.html     — Polityka prywatności (standalone HTML)
    icons/                  — Ikony (192, 512, maskable, apple-touch, favicon, 1024, source SVG)
  scripts/
    generate-icons.mjs      — Generacja ikon z source PNG (wymaga sharp)
```

### API w buildach natywnych
- `client.js` czyta `import.meta.env.VITE_API_URL || "/api"`
- Web (dev/prod): proxy nginx → `/api` → backend → działa relative
- Native (Capacitor): brak nginx, wymaga absolutny URL → `.env.capacitor` ustawia `VITE_API_URL=https://www.smartme.life/api`
- Scripty `cap:build:android` / `cap:build:ios` używają `--mode capacitor` automatycznie

### CORS dla Capacitor
Backend (`config.py`) zawiera dodatkowe origins dla natywnych WebView:
- `https://localhost` (Android Capacitor)
- `capacitor://localhost` (iOS Capacitor)
- `http://localhost`

### Uprawnienia natywne
- **Android**: `INTERNET`, `RECORD_AUDIO` (AndroidManifest.xml)
- **iOS**: `NSMicrophoneUsageDescription` (Info.plist, po polsku)
- **iOS orientation**: portrait-only

### Komendy Capacitor
```bash
cd frontend

# Sync web assets do platform
npm run cap:sync

# Build + sync Android
npm run cap:build:android

# Build + sync iOS
npm run cap:build:ios

# Otwórz w IDE
npm run cap:open:android    # Android Studio
npm run cap:open:ios        # Xcode
```

### Ikony
- Source SVG: `public/icons/icon-source.svg` (gradient rose→peach, "SM")
- Generowane: 192, 512, maskable-192, maskable-512, apple-touch-180, favicon-16/32, 1024
- Android: mipmap PNGs (mdpi→xxxhdpi) + adaptive icon (foreground PNG + #FBF8F9 background)
- iOS: AppIcon-512@2x.png (1024×1024)
- Regeneracja: `node scripts/generate-icons.mjs path/to/icon-1024.png` (wymaga `npm install -D sharp`)

## CI/CD — GitHub Actions

### Workflows
```
.github/workflows/
  build.yml     — Frontend build + Android debug APK
  ios.yml       — iOS build validation (macOS runner) + signed build skeleton
```

### build.yml (ubuntu-latest)
1. **frontend-build**: npm ci → web build → capacitor build → cap sync → upload dist
2. **android-build** (needs frontend-build): Java 17 + Android SDK → cap sync android → Gradle assembleDebug → upload APK

### ios.yml (macos-latest)
1. **ios-build** (always runs): npm ci → vite build → cap sync ios → resolve SPM → `xcodebuild build` (CODE_SIGNING_ALLOWED=NO, simulator)
2. **ios-signed-build** (gated by `vars.IOS_SIGNING_ENABLED == 'true'`): certificate + profile install → archive → export IPA

### Wymagane secrets (dla signed iOS build)
| Secret | Opis |
|--------|------|
| `IOS_CERTIFICATE_P12_BASE64` | Base64 .p12 certificate |
| `IOS_CERTIFICATE_PASSWORD` | Hasło P12 |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 provisioning profile |
| `IOS_KEYCHAIN_PASSWORD` | Dowolny string (temp keychain) |
| `IOS_TEAM_ID` | Apple Team ID (10 znaków) |

### Repo variable
| Variable | Opis |
|----------|------|
| `IOS_SIGNING_ENABLED` | `true` aby włączyć signed build |

## PWA / Manifest

- `public/manifest.json`: name="SmartMe", display="standalone", orientation="portrait"
- Theme color: `#F4A0B5` (rose)
- Background color: `#FBF8F9` (ciepły beżowy)
- Icons: 192, 512 (any + maskable)
- `index.html`: manifest link, theme-color meta, apple-mobile-web-app meta, favicons

## Polityka prywatności i compliance

### Polityka prywatności
- Plik: `frontend/public/privacy-policy.html` (standalone HTML, po polsku)
- URL produkcyjny: `https://www.smartme.life/privacy-policy.html`
- Link w apce: Ustawienia → "Informacje prawne" → "Polityka prywatności"
- Treść: zbierane dane, OpenAI (Whisper/GPT), usunięcie konta, RODO, kontakt

### Usunięcie konta (Apple/Google requirement)
- Endpoint: `POST /api/auth/reset` — wymaga auth + potwierdzenie hasłem
- **Działa w produkcji** (production block usunięty)
- Kasuje kaskadowo: 13 tabel + user record
- UI: Ustawienia → "Strefa ostrożności" → "Resetuj konto" → hasło + dialog potwierdzenia
- Po usunięciu: redirect do /setup

## Komendy — lokalne (dev)
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

## Deploy na serwer produkcyjny

### Infrastruktura
- **VPS**: Hetzner CX23, Ubuntu, `89.167.123.192`
- **Domena**: `www.smartme.life` (DNS A record → VPS IP)
- **SSL**: Let's Encrypt (certbot), certyfikat ważny do 2026-06-08
- **SSH**: `ssh root@89.167.123.192` (klucz ed25519 z maszyny Rafa)
- **Pliki na serwerze**: `/root/anelka/`
- **Docker Compose prod**: `docker-compose.prod.yml` (porty 80/443, frontend jako static build, certbot)
- **Env prod**: `/root/anelka/.env` (silny SECRET_KEY i DB_PASSWORD, CORS tylko https://www.smartme.life)

### Różnice prod vs dev
| | Dev (localhost) | Prod (VPS) |
|---|---|---|
| Compose file | `docker-compose.yml` | `docker-compose.prod.yml` |
| Frontend | Vite dev server (HMR) | Static build (nginx) |
| Frontend Dockerfile | `Dockerfile` | `Dockerfile.prod` |
| Nginx config | `nginx/nginx.conf` | `nginx/nginx.prod.conf` |
| Porty | 81, 8001, 3001, 5433 | 80, 443 (SSL) |
| CORS | localhost:81, localhost:3001 | https://www.smartme.life |
| SSL | Brak | Let's Encrypt + HSTS |

### Procedura deploy (krok po kroku)
```bash
# 1. Wypchnij pliki z lokalnej maszyny na serwer (z katalogu anelka)
tar --exclude='node_modules' --exclude='.git' --exclude='__pycache__' --exclude='*.pyc' --exclude='.env' --exclude='pgdata' -czf - . | ssh root@89.167.123.192 "cd /root/anelka && tar xzf -"

# 2. Przebuduj i uruchom kontenery na serwerze
ssh root@89.167.123.192 'cd /root/anelka && docker compose -f docker-compose.prod.yml up --build -d'

# 3. Poczekaj ~15s na start backendu (migracje Alembic), potem restart nginx
ssh root@89.167.123.192 'sleep 15 && docker restart anelka-nginx'

# 4. Weryfikacja
ssh root@89.167.123.192 'curl -s https://www.smartme.life/api/health'
# Oczekiwany wynik: {"status":"ok","database":"ok"}
```

### Odnawianie certyfikatu SSL
```bash
ssh root@89.167.123.192 'cd /root/anelka && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker restart anelka-nginx'
```

### Logi produkcyjne
```bash
ssh root@89.167.123.192 'docker logs anelka-backend --tail 30'
ssh root@89.167.123.192 'docker logs anelka-nginx --tail 30'
```

### UWAGA: .env produkcyjny
- **NIE nadpisuj** `/root/anelka/.env` na serwerze — zawiera unikalne hasła wygenerowane na VPS
- Lokalne `.env` jest WYŁĄCZONE z tar (`--exclude='.env'`)
- Jeśli trzeba zmienić zmienną, edytuj ręcznie: `ssh root@89.167.123.192 'nano /root/anelka/.env'`
