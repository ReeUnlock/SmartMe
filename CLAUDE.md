# Anelka (SmartMe) — Instrukcje dla Claude

## Projekt
Multi-user hub zarządzania życiem. Mobile-first, ciepłe pastele, UI po polsku.
Domena produkcyjna: `smartme.life`

## Stack
- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0, PostgreSQL 16, Alembic
- **Frontend**: React 19, Vite 6, Chakra UI v3, React Router v7, TanStack Query v5, zustand v5
- **Mobile**: Capacitor 8 (Android + iOS), app id: `com.rafaldebski.smartme`
- **Infra**: Docker Compose (db, backend, frontend, nginx)
- **CI/CD**: GitHub Actions (build + Android APK + iOS validation)
- **AI**: OpenAI API (Whisper transkrypcja + GPT-4o-mini parsowanie intencji)
- **OCR**: Tesseract (lokalnie, język polski)
- **Billing**: Stripe (checkout, customer portal, webhooks for subscription lifecycle)
- **Email**: Resend (transactional emails — welcome, verification, password reset, upgrade, downgrade, support)
- **Monitoring**: Sentry (frontend @sentry/react), PostHog (analytics, EU, opt-in via cookie consent)
- **Analytics**: PostHog (`posthog-js`) — initialized only after cookie consent

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
  config.py         — Settings (env vars, CORS_ORIGINS, FRONTEND_URL)
  database.py       — SQLAlchemy engine (pool_pre_ping, pool_recycle=1800, pool_size=5), session, Base
  auth/             — JWT auth (register, login, verify-email, reset-password, me, change-password, complete-onboarding, reset, setup [deprecated alias for register]), tokens.py (auth token CRUD)
  calendar/         — wydarzenia, recurrence (RRULE via dateutil), duplikaty per dzień, service.py (expand_events)
  shopping/         — listy zakupów, kategorie, itemy, toggle, reorder, to-expense (smart category split)
  expenses/         — wydatki, kategorie, domownicy, cykliczne, budżet, summary, comparison
  plans/            — cele (manual/savings/spending_limit), milestones, bucket lista
  feedback/         — feedback z opcjonalnym user_id (bug/idea/opinion/broken)
  voice/            — transkrypcja (Whisper) + parsowanie intencji (GPT) + executors + calendar_validator + prompts.py
  receipts/         — OCR paragonów (Tesseract pol), heurystyczny parser (sklep, data, suma, produkty)
  common/           — TimestampMixin, pagination, email.py (Resend transactional emails)
  billing/          — Stripe billing: checkout, portal, webhooks, subscription model, feature limits
  rewards/          — backend persistence for rewards system (models.py, router.py, schemas.py) — GET/PATCH /api/rewards
  notifications/    — (puste — przyszłe push notifications, pywebpush zainstalowany)
  ai/               — (puste — przyszłe AI features)
backend/alembic/    — migracje DB (19 plików, env.py importuje wszystkie modele)
backend/tests/      — testy backendowe (pytest, SQLite in-memory)
  conftest.py         — fixtures, test DB, helpers (create_user, login_user, auth_header)
  auth/               — 62 testy auth (lifecycle, validation, rate limiting, security, edge cases)
  rewards/            — 11 testów rewards (defaults, partial/full update, JSON fields, isolation, cascade, auth)
landing/            — statyczny landing page (smartme.life), serwowany przez nginx
  index.html        — główna strona (10 sekcji: navbar, hero, problem, features, screenshots z interaktywnym demo, life OS, social proof, download CTA, FAQ, footer)
  privacy.html      — polityka prywatności
  terms.html        — regulamin
  cookies.html      — polityka cookies
  icons/            — favicon, apple-touch (kopia z frontend/public/icons)
  assets/           — grafiki landing page (modelki 3D, logo, screenshoty aplikacji)
```

## Struktura frontendu
```
frontend/src/
  App.jsx           — Router + ChakraProvider + QueryClientProvider + ErrorBoundary + Global Overlays (lazy) + CookieConsent
  theme.js          — pastelowa paleta: rose, peach, sage, sky, lavender + semantic tokens
  api/              — client.js (apiFetch + apiUpload z JWT, VITE_API_URL env, 401+403→redirect login), pliki per moduł (auth, calendar, shopping, expenses, plans, voice, receipts, billing, rewards)
  config/
    motionConfig.js   — centralna konfiguracja animacji: EASING, DURATION, Z-index, celebration presets, micro-feedback, module themes
  styles/
    motion.css        — CSS @keyframes: page transitions, micro-interactions, ambient effects, dialog system, loader
  utils/
    soundManager.js   — audio pool (3 instancje/dźwięk), microtask batching, priority system
    rewardEngine.js   — calculateLevel (30 levels), processStreak, grantReward, daily reset
    achievementEngine.js — 18 achievements (3 tiers), 7 level milestones, checkAchievements
    challengeEngine.js — seeded random challenges, DAILY_POOL(7), WEEKLY_POOL(10), progress tracking
    storage.js        — per-user localStorage scoping (getStorageKey, getUserStorage, setUserStorage, migrateStorageForUser)
    shoppingUtils.js  — parseItemInput ("2kg ziemniaki"), inferCategoryId (400+ weighted keywords)
    imageCompressor.js — client-side image resize+JPEG compression before upload (max 1920px, 0.85 quality)
    debounce.js       — generic debounce utility (used by rewards write-through)
    reactionConfig.js — per-avatar personality pools, 7 event types, bubble/label themes
    posthog.js — PostHog init (initPostHog, trackEvent), reads VITE_POSTHOG_KEY env
  hooks/
    useAuth.js          — zustand, single-user JWT auth, token expiry check (60s buffer)
    useCalendar.js      — TanStack Query, events CRUD + useEventHistory integration
    useEventHistory.js  — zustand, undo/redo (max 3 kroki)
    useShopping.js      — TanStack Query, optimistic toggle, categories (staleTime 5min)
    useExpenses.js      — TanStack Query, CRUD + recurring + budget + summary + comparison + bulk delete month
    useExpenseUndo.js   — zustand, undo stack (max 5)
    usePlans.js         — TanStack Query, goals + milestones + bucket + summary
    useRewards.js       — zustand+localStorage, sparks/level/streak, reward(action), addBonusSparks
    useAchievements.js  — zustand+localStorage, trackProgress, updateMaxStreak, checkLevelRewards
    useChallenges.js    — zustand+localStorage, sync, trackAction, claimReward, claimAllBonus
    useCelebration.js   — zustand, celebrate(type, options), priority + throttling
    useAvatarReaction.js — zustand, react(type), probability + cooldown, session cap (20)
    useVoiceCommand.js  — zustand, MediaRecorder, startRecording/stopRecording/confirmAction
    useIntroTour.js     — zustand+localStorage, hasSeenTour/isTourOpen/openTour/closeTour/markAsSeen
    useQuickTemplates.js — zustand+localStorage, szablony kalendarza (max 12)
    useShoppingTemplates.js — zustand+localStorage, szablony zakupów (max 20)
    useItemHistory.js   — zustand+localStorage, historia produktów (max 100, LRU)
    useSoundSettings.js — zustand+localStorage, enabled/volume
    useKeyboardOpen.js  — React hook, iOS visualViewport detection
    useMicroFeedback.js — React hook, imperative CSS class trigger (zero re-renders)
    useRewardsSync.js   — server sync + localStorage migration for rewards system (called in DashboardPage)
  components/
    layout/         — AppShell (gradient bg + animated blobs), BottomNav (mobile, 5 items, id="bottom-nav"), Sidebar (desktop, id="sidebar-nav"), Header (logo + info/settings icons)
    auth/           — RegisterPage, LoginPage, ForgotPasswordPage, EmailVerificationPage, NewPasswordPage, SetupPage (redirect→/rejestracja), OnboardingPage (3 steps), ProtectedRoute
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
      ExpensesList.jsx       — lista z search, filtry, delete z undo, bulk delete w miesiącu z potwierdzeniem
      ExpensesDashboard.jsx  — summary: total, by_category, trend
      BudgetView.jsx         — budżet per kategoria
      RecurringExpenses.jsx  — wydatki cykliczne
      AddExpenseDialog.jsx   — formularz wydatku
      ExpenseUndoBar.jsx     — toast undo (scoped to Expenses screen)
      QuickAdd.jsx           — szybkie dodawanie wydatków
      ReceiptScannerDialog.jsx — skanowanie paragonów (OCR): zdjęcie → upload → draft → zapisz wydatek
    plans/          — Plany (kolor: rose/róż)
      PlansPage.jsx          — tab bar: Cele / Bucket Lista
      GoalsView.jsx          — lista celów z search + filtry (kategoria, status)
      GoalCard.jsx           — karta celu z progress bar
      GoalDetail.jsx         — pełny widok z milestones
      GoalFormDialog.jsx     — formularz celu
      BucketListView.jsx     — lista marzeń
      BucketItemFormDialog.jsx — formularz bucket item
    voice/          — VoiceFab (floating mic 72px, rose-peach gradient, fullscreen processing overlay), VoiceConfirmationDialog
    intro/          — Spotlight Tour system
      SpotlightTour.jsx  — portal overlay: SVG mask spotlight, welcome card, step cards, swipe nav
      tourSteps.js       — 4 steps: welcome + voice-fab + navigation + reward-bar
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
      CookieConsent.jsx      — cookie consent banner (PostHog opt-in), localStorage key: smartme_cookie_consent
      DateTimeInput.jsx      — date+time picker z accent color
      DateInput.jsx          — date-only picker
      SmartMeLogo.jsx        — logo (image fallback)
      FeedbackDialog.jsx     — formularz opinii
      SettingsPage.jsx       — profil, hasło, reset, dźwięki, feedback, avatar link, pomoc (intro tour), polityka prywatności (subskrypcja ukryta)
    affirmation/    — Avatar system
      AffirmationAvatar.jsx    — state machine (idle/happy/think/reading), afirmacje, particles
      AvatarSelectionPage.jsx  — galeria kart avatarów (locked/active)
      AvatarReaction.jsx       — bąbelki reakcji (3.5s display)
      AvatarThumbnail.jsx      — miniatura
      avatarConfig.js          — Sol(L1), Nox(L1), Bloom(L5), Aura(L10), selection helpers
      reactionConfig.js        — message pools per avatar × event type, bubble/label themes
      shared.jsx               — HeartSvg, StarSvg, particle utils
      avatars/                 — SolSun, NoxMoon, BloomFlower, AuraOrb (SVG components)
    billing/        — PricingCard, PricingSection (plany Free/Pro, Chakra UI)
    landing/        — LandingPage (hero, features, pricing, footer — public /start)
    celebration/    — CelebrationOverlay (imperative RAF particle + glow engine, safety timeout 5s)
    dashboard/
      DashboardPage.jsx          — ReorderableTiles (drag-reorder, localStorage order), auto-opens intro tour on first visit
      DashboardGreeting.jsx      — random greeting + date + level badge
      RewardBar.jsx              — level circle, sparks, streak, XP bar (id="reward-bar")
      TodayWidget.jsx            — today summary
      GoalsWidget.jsx            — goals preview
      BudgetWidget.jsx           — budget preview
      ShoppingWidget.jsx         — shopping preview
      ChallengesWidget.jsx       — challenges preview (lazy)
      AttentionWidget.jsx        — alerts/reminders (lazy)
      AchievementsPage.jsx       — gablotka: RewardBar + kolekcja, postęp, kategorie, level rewards
      ChallengesPage.jsx         — dzienne (lavender) + tygodniowe (rose/peach) wyzwania
```

## Baza danych — tabele (17)
```
users               — multi-user auth (username, email, hashed_password, onboarding_completed, plan, is_email_verified, email_verified_at)
auth_tokens         — email verification & password reset tokens (user_id, token, token_type, expires_at, used_at)
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
subscriptions       — Stripe billing (user_id, plan, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end)
feedback            — feedback z opcjonalnym user_id (message, category: bug/idea/opinion/broken, email, user_agent, user_id)
user_rewards        — rewards persistence per user (sparks, level, streak, streak_last_date, xp, achievements JSONB, challenges_state JSONB, avatar_key, seen_avatar_unlocks JSONB)
```

### Stan migracji vs baza
- **Migracja `257290e4561e`** (przygotowana, NIE uruchomiona): dodaje `users.plan` + tabelę `subscriptions`
- **Migracja `e5f6a7b8c9d0`** (uruchomiona dev): dodaje tabelę `user_rewards` (rewards persistence)
- **Baza produkcyjna**: brakuje kolumny `users.plan` i tabeli `subscriptions` — backend crashuje przy odwołaniu do tych pól
- **Uruchomienie**: `docker exec anelka-backend alembic upgrade head`

## Routing (polskie ścieżki)
```
/start             — landing page (public, 10 sekcji: hero, problem, features, interactive demo, life OS, social proof, download CTA, FAQ, footer)
/rejestracja       — rejestracja (tworzenie konta, email verification)
/setup             — redirect do /rejestracja (deprecated, frontend redirect only)
/login             — logowanie, linki do rejestracji i odzyskiwania hasła
/odzyskaj-haslo    — odzyskiwanie hasła (wysyła link na email)
/weryfikacja-email — weryfikacja emaila (token z URL)
/nowe-haslo        — ustawianie nowego hasła (token z URL)
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
Wszystkie endpointy pod `/api/`. Wymagają JWT oprócz `/api/auth/register`, `/api/auth/setup`, `/api/auth/login`, `/api/auth/verify-email`, `/api/auth/resend-verification`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/api/health`, `/api/feedback`, `/api/billing/plans`, `/api/billing/webhooks/stripe`, `/api/auth/test-verify-email` (dev-only), `/api/auth/test-reset-rate-limits` (dev-only).

### Rewards API
- `GET /api/rewards` — current user's rewards state (auto-creates row with defaults if none)
- `PATCH /api/rewards` — partial update of rewards fields (sparks, level, streak, xp, achievements, challenges_state, avatar_key, seen_avatar_unlocks)

### Billing API
- `GET /api/billing/plans` — public, pricing info (Free/Pro features)
- `GET /api/billing/subscription` — current user's subscription status
- `POST /api/billing/checkout` — create Stripe Checkout session (redirects to Stripe)
- `POST /api/billing/portal` — create Stripe Customer Portal session
- `POST /api/billing/webhooks/stripe` — Stripe webhook (checkout.session.completed, invoice.paid, customer.subscription.updated/deleted, invoice.payment_failed)

### Email (Resend)
- `send_verification_email(to, username, token)` — link weryfikacyjny po rejestracji (24h ważność)
- `send_password_reset_email(to, username, token)` — link do resetu hasła (24h ważność)
- `send_welcome(to, name)` — po weryfikacji emaila
- `send_upgrade_confirmation(to, name)` — po upgrade do Pro
- `send_downgrade_notice(to, name)` — po anulowaniu/wygaśnięciu Pro
- `send_support_message(from_email, message)` — forwarding do support@smartme.life
- Graceful no-op gdy `RESEND_API_KEY` jest pusty (dev mode)

### Feature limits (billing/limits.py)
**UWAGA: Limity zdefiniowane ale NIE egzekwowane w endpointach API (Sprint 1)**

| Feature | Free | Pro |
|---------|------|-----|
| shopping_lists | 10 | Bez limitu |
| expenses_per_month | 100 | Bez limitu |
| calendar_events | 50 | Bez limitu |
| goals | 5 | Bez limitu |
| voice_commands_per_day | 20 | Bez limitu |
| receipt_scans_per_month | 10 | Bez limitu |

### Kluczowa logika biznesowa
- **Duplikaty kalendarza**: backend 409 jeśli ten sam `title` w danym dniu; frontend wyszarza quick-add buttony
- **RRULE**: `expand_events()` rozwija wydarzenia cykliczne w zakresie dat (max 365 dni do przodu)
- **Zakupy → Wydatki**: `POST /shopping/lists/{id}/to-expense` — smart category split proporcjonalnie do kategorii produktów
- **Wydatki cykliczne**: `POST /expenses/recurring/generate {year, month}` — tworzy z szablonów, nigdy nie duplikuje
- **Bulk delete**: `DELETE /expenses/month?year=X&month=Y` — kasuje wszystkie wydatki w miesiącu, wymaga potwierdzenia w UI
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
System nagród przechowywany w DB (`user_rewards` table) z cross-device sync. LocalStorage jako offline cache. Sync hook: `useRewardsSync` (DashboardPage) — migruje dane z localStorage do serwera przy pierwszym uruchomieniu, potem hydruje stores z serwera. Write-through: debounced 800ms PATCH po każdej zmianie stanu (sparks, achievements, challenges, avatar).

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
| Cookie Consent | `smartme_cookie_consent` |
| Intro Tour | `smartme_intro_tour` |
| Rewards Synced | `smartme_rewards_synced` |

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
- `Z` — z-index map: background(0) → content(1) → stickyControls(10) → bottomNav(200) → undoBar(250) → voiceFab(300) → dialog(400-401) → affirmation(450) → voiceProcessing(499) → toast(500) → tour(550) → celebration(599-600)
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
| `sm-dot-bounce` | vertical bounce | 0.9s | voice processing overlay |

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

## Intro Spotlight Tour
- 4 kroki: welcome (centered card, logo, body, CTA) → voice-fab → navigation → reward-bar
- Spotlight: SVG mask cutout + white ring around target element
- Auto-opens on first dashboard visit (1200ms delay), per-user localStorage
- Re-open: Header info icon (mobile) + Settings "Pomoc" section
- Swipe navigation (50px threshold) + keyboard Escape to close
- Welcome step: no spotlight, centered card with `whiteSpace: pre-line` body
- Step counter excludes welcome step (1/3, 2/3, 3/3)
- Target IDs: `voice-fab`, `bottom-nav`/`sidebar-nav` (responsive), `reward-bar`
- Z-index: `Z.tour` (550) — above toasts, below celebration
- Hook: `useIntroTour` (zustand + localStorage `smartme_intro_tour`)

## VoiceFab — redesign
- 72px button (was 48px), rose-peach gradient (`linear-gradient(135deg, #FF8FAB, #F9915E)`)
- Recording: red.500, pulse animation, duration badge
- Processing: fullscreen portal overlay (z-index 499), blurred backdrop, centered white card with gradient mic icon, bouncing dots (`sm-dot-bounce`), Polish status text
- FAB hidden during processing state (`{!isProcessing && ...}`)
- `id="voice-fab"` for spotlight tour targeting

## System opinii (Feedback)
- Endpoint: `POST /api/feedback` (rate limit: 5/min, bez auth)
- Model: `message`, `category` (bug/idea/opinion/broken), `email` (opcjonalny), `user_agent`
- Tabela nie ma `user_id` — feedback anonimowy (single-user app)
- Frontend: `FeedbackDialog` w Ustawieniach

## Receipt OCR (Faza 5)
- `POST /api/receipts/scan` — upload image (multipart) → Tesseract OCR (pol) → heurystyczny parser → structured result
- Max image: 10 MB, formaty: JPEG, PNG, WebP, HEIC/HEIF (+ `application/octet-stream` z magic-byte sniffing)
- Pipeline: EXIF transpose → resize (max 2000px) → grayscale → autocontrast → sharpen → Tesseract (psm=6)
- Parser: 50+ znanych sklepów PL (fuzzy matching z normalizacją polskich znaków), regexowe daty (DD.MM.YYYY, YYYY-MM-DD)
- **Total detection**: priority-based — SUMA/RAZEM/DO ZAPŁATY (high) → WPŁATA (low fallback) → suma itemów → largest price; excludes GOTÓWKA/RESZTA/KARTA/SUMA PTU
- **Skip patterns**: GOTÓWKA, Sp: (VAT subtotals), Udzielono, #Kasa, Kasjer, łącznie rabat, A=12,92 (VAT lines)
- **Discounts**: per-item OPUST captured as Rabat; summary lines (OPUSTY ŁĄCZNIE, Udzielono łącznie) skipped
- **Confidence scoring**: `good`/`partial`/`weak`/`none` — zwracane w response, frontend wyświetla odpowiedni banner
- **Specific error types**: `TesseractNotFoundError`, `LanguagePackMissingError`, `ImageFormatError`, `EmptyOCRError` → różne HTTP kody i user-facing messages
- Frontend: ReceiptScannerDialog (3 kroki: pick → scanning → draft review), client-side kompresja (max 1920px, JPEG 0.85)
- Frontend partial results: zawsze przechodzi do draft (nawet bez total), confidence banner, orange highlight na brakującej kwocie
- Integracja: Dashboard "Skanuj paragon" card + Lista ikona paragonu → draft → createExpense + rewards

## Rate Limiting
- In-memory sliding window per IP
- `/api/auth/register`: 3/min, `/api/auth/setup`: 3/min (deprecated, identical to /register), `/api/auth/login`: 5/min, `/api/auth/change-password`: 5/min, `/api/auth/forgot-password`: 3/min, `/api/auth/resend-verification`: 3/min, `/api/auth/verify-email`: 5/min, `/api/auth/reset-password`: 5/min, `/api/feedback`: 5/min

## Konwencje
- **Język UI**: polski (wszystkie teksty, komunikaty, placeholdery)
- **Język kodu**: angielski (nazwy zmiennych, funkcji, klas, plików)
- **Polskie znaki w JSX**: ZAWSZE opakowuj w wyrażenia JS `{"tekst z polskimi znakami"}`, NIE wstawiaj `\uXXXX` w surowym tekście JSX — będzie wyświetlony dosłownie
- **Auth**: multi-user, rejestracja z weryfikacją email, token-based password reset (24h ważność). HTTPBearer zwraca 403 gdy brak tokenu — `client.js` traktuje 401+403 jako unauthorized (redirect → /login)
- **localStorage**: per-user scoping via `utils/storage.js` (klucze z prefixem `user_{id}_`), migracja danych przy pierwszym logowaniu
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
- **PostHog**: opt-in only, initialized after cookie consent (`CookieConsent.jsx`), env vars: `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST` (default EU)
- **Budget input**: `step="any"` (not `step="100"`), backend `BudgetSet.amount` has `le=10_000_000` upper bound
- **Testy backend auth**: `docker exec anelka-backend python -m pytest tests/auth/ -v --tb=short` (62 testy, SQLite in-memory)
- **Testy backend rewards**: `docker exec anelka-backend python -m pytest tests/rewards/ -v --tb=short` (11 testów, SQLite in-memory)
- **Testy E2E**: `npx playwright test e2e/auth/` (wymaga działającego docker-compose, 25 testów Playwright)
- **Testy all**: `npm run test:auth:all` (backend + E2E sekwencyjnie)

## Fazy implementacji
- [x] Faza 0: Fundament (auth, layout, routing, Alembic)
- [ ] Faza 1: Obowiązki (chores + household_members)
- [x] Faza 2: Zakupy (shopping lists + categories + items)
- [x] Faza 3: Kalendarz (events + recurrence + undo/redo + quick-add + duplikaty)
- [x] Faza 4: Wydatki (expenses + categories + summary + recurring + budget)
- [x] Faza 5: OCR paragonów (Tesseract, heurystyczny parser, klient-side kompresja, ReceiptScannerDialog)
- [x] Faza 6: Plany (goals, milestones, bucket list)
- [ ] Faza 7: Push Notifications (VAPID, service worker)
- [ ] Faza 8: AI (OpenAI, sugestie, chat)
- [ ] Faza 9: Polish (Google Calendar, PWA, streaming AI)
- [x] Faza R: SmartMe Rewards (sparks, levels, achievements, challenges, celebrations, avatars, affirmations)
- [x] Faza M: Motion System (motionConfig, micro-feedback, ambient animations, branded loader/empty states)
- [x] Faza S: Store Readiness (Capacitor, manifest, icons, CI/CD, privacy policy, account deletion)
- [x] Faza B: Billing (Stripe checkout, portal, webhooks, subscription model, feature limits, Resend emails)
- [x] Faza L: Landing Page (smartme.life — 10 sekcji: hero z modelką 3D i floating cards, problem, features, interaktywne demo screenshots, life OS, social proof, download CTA, FAQ, footer; grafiki: 3 modelki, 3 screenshoty, logo)
- [x] Faza T: Intro Tour (spotlight tour 4 kroków, VoiceFab redesign, processing overlay)

## Audyt produkcyjny i sprinty
- **Data audytu**: 2026-03-14
- **Plan sprintów**: `sprinty.md` (7 sprintów, priorytetyzowane wg ryzyka)
- **Status**: Sprint 0 (naprawa schematu billing) — migracja przygotowana, do uruchomienia
- **Sprint 0**: migracja `257290e4561e` — `users.plan` + `subscriptions` table (przygotowana, nie uruchomiona)
- **Blokery przed pierwszym płacącym klientem**: uruchomienie migracji billing, egzekwowanie limitów Free/Pro, webhook payment_failed, weryfikacja email przy reset hasła, backup DB, Stripe live mode

## Testy
- **Backend auth**: 62 testy pytest (lifecycle ×13, walidacja ×22, rate limiting ×4, token security ×8, password edge cases ×9, account deletion ×3, public endpoints ×3)
- **Backend rewards**: 11 testów pytest (defaults ×2, partial/full update ×4, isolation ×2, cascade ×1, auth ×2)
- **E2E auth**: 25 testów Playwright (lifecycle ×8, validation ×6, security ×11)
- **Infrastruktura**: SQLite in-memory (backend), Chromium headless (E2E)
- **E2E helpers**: `e2e/auth/helpers.ts` — `apiRegister`, `apiVerifyEmail`, `apiSetupAndLogin`, `apiLogin`, `apiDeleteAccount`, `apiResetRateLimits`
- **Dev-only test endpoints** (blocked in production via `ENV` check):
  - `POST /api/auth/test-verify-email` — auto-verify user email (E2E can't receive real emails)
  - `POST /api/auth/test-reset-rate-limits` — clear all rate limiters (prevents cross-test 429s)
- **Pliki**: `backend/tests/conftest.py`, `backend/tests/auth/test_auth_full.py`, `e2e/auth/*.spec.ts`, `playwright.config.ts`

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
  .env                      — Dev (VITE_API_URL unset → "/api", VITE_POSTHOG_KEY optional)
  .env.production           — Web prod (VITE_API_URL unset → "/api", VITE_POSTHOG_KEY, VITE_POSTHOG_HOST)
  .env.capacitor            — Native builds (VITE_API_URL=https://smartme.life/api)
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
- Native (Capacitor): brak nginx, wymaga absolutny URL → `.env.capacitor` ustawia `VITE_API_URL=https://app.smartme.life/api`
- Scripty `cap:build:android` / `cap:build:ios` używają `--mode capacitor` automatycznie

### CORS dla Capacitor
Backend (`config.py`) zawiera dodatkowe origins dla natywnych WebView:
- `https://localhost` (Android Capacitor)
- `capacitor://localhost` (iOS Capacitor)
- `http://localhost`

### Uprawnienia natywne
- **Android**: `INTERNET`, `RECORD_AUDIO`, `CAMERA`, `READ_MEDIA_IMAGES` (AndroidManifest.xml)
- **iOS**: `NSMicrophoneUsageDescription`, `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription` (Info.plist, po polsku)
- **iOS orientation**: iPhone portrait-only, iPad all orientations (Apple multitasking requirement)
- **UWAGA**: brak NSCameraUsageDescription/NSPhotoLibraryUsageDescription crashuje apkę na iOS przy próbie otwarcia kamery/galerii

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
- Triggers: push to main, PR to main, workflow_dispatch (manual)
1. **ios-build** (always runs): npm ci → vite build → cap sync ios → resolve SPM → `xcodebuild build` (CODE_SIGNING_ALLOWED=NO, simulator)
2. **ios-signed-build** (gated by `vars.IOS_SIGNING_ENABLED == 'true'`, push/dispatch only): certificate + profile install → archive → export IPA → upload to TestFlight
- **TestFlight**: automatyczny upload po każdym pushu na main (gdy IOS_SIGNING_ENABLED=true)
- **Build number**: auto-increment z `github.run_number`

### Wymagane secrets (dla signed iOS build + TestFlight)
| Secret | Opis |
|--------|------|
| `IOS_CERTIFICATE_P12_BASE64` | Base64 .p12 certificate (Apple Distribution) |
| `IOS_CERTIFICATE_PASSWORD` | Hasło P12 |
| `IOS_PROVISION_PROFILE_BASE64` | Base64 provisioning profile (App Store) |
| `IOS_KEYCHAIN_PASSWORD` | Dowolny string (temp keychain) |
| `IOS_TEAM_ID` | Apple Team ID: `VFCT675MVA` |
| `APPSTORE_API_KEY_ID` | App Store Connect API key ID: `HB94WBMS6W` |
| `APPSTORE_API_ISSUER_ID` | App Store Connect issuer ID |
| `APPSTORE_API_KEY_BASE64` | Base64 .p8 API key |

### Repo variable
| Variable | Opis |
|----------|------|
| `IOS_SIGNING_ENABLED` | `true` — włączone, signed build + TestFlight upload |

### Apple Developer
- **Team**: WOA - Wellness Over All Sp. z o.o.
- **Team ID**: `VFCT675MVA`
- **Bundle ID**: `com.rafaldebski.smartme`
- **Provisioning Profile**: "SmartMe AppStore" (App Store distribution)
- **Certificate**: Apple Distribution (w repo: `smartme_dist_new.p12`, hasło: `smartme2026`)
- **App Store Connect API key**: `AuthKey_HB94WBMS6W.p8`

### Ważne pliki podpisywania (w katalogu anelka, NIE commitować!)
```
smartme_dist_new.p12              — Distribution certificate (.p12, hasło: smartme2026)
SmartMe_AppStore.mobileprovision  — App Store provisioning profile
AuthKey_HB94WBMS6W.p8            — App Store Connect API key
smartme_ios.key                   — Klucz prywatny certyfikatu
smartme_ios.csr                   — Certificate Signing Request
distribution.cer                  — Surowy certyfikat Apple
```

### Wymagania App Store (walidacja przy upload)
- **Ikona**: bez kanału alpha (przezroczystości) — AppIcon-512@2x.png musi być RGB
- **iPad orientacje**: Info.plist `UISupportedInterfaceOrientations~ipad` musi zawierać wszystkie 4 orientacje
- **iOS SDK**: od 28.04.2026 wymagany iOS 26 SDK (Xcode 26)

## PWA / Manifest

- `public/manifest.json`: name="SmartMe", display="standalone", orientation="portrait"
- Theme color: `#F4A0B5` (rose)
- Background color: `#FBF8F9` (ciepły beżowy)
- Icons: 192, 512 (any + maskable)
- `index.html`: manifest link, theme-color meta, apple-mobile-web-app meta, favicons

## Polityka prywatności i compliance

### Polityka prywatności
- Plik: `frontend/public/privacy-policy.html` (standalone HTML, po polsku)
- URL produkcyjny: `https://smartme.life/privacy.html` (na landing) + `https://app.smartme.life/privacy-policy.html` (w apce)
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

## Landing Page (smartme.life)

### Struktura
Statyczny HTML (`landing/index.html`) serwowany przez nginx. Brak React/Next.js — czysty HTML/CSS/JS. `html` + `body` mają `overflow-x: hidden` (blokada poziomego scrollu na mobile).

### Sekcje (10)
1. **Navbar** — fixed, blur on scroll, logo PNG (80px desktop, 48px mobile), przycisk "Sprawdź jak działa" → app.smartme.life/login
2. **Hero** — 55/45 grid (tekst | modelka_header), badge "Sterowanie głosem", voice demo card (rotacja komend co 2.5s), floating cards (Zakupy, Cel, Wydatki, Wyzwanie), przyciski App Store/Google Play
3. **Problem** — 4 karty z SVG ikonami (sky, peach, lavender, rose), CTA "Dlatego powstało SmartMe"
4. **Features** — 5 kart (2x2 + 1 centered): Wydatki, Cele, Zakupy, Kalendarz, Wyzwania — każda z voice hint i bullet pills
5. **Screenshots** — 3 phone mockups (ramka #3B4A63), klikalne → interaktywne demo w modalu
6. **Life OS** — gradient bg (pink→mint), modelka_1, voice wave equalizer, lista zalet
7. **Social Proof** — 3 testimoniale, rating 4.9/5
8. **Download CTA** — modelka_2 po lewej, przyciski store, badges
9. **FAQ** — 6 pytań accordion
10. **Footer** — ciemny (#2D2D2D), 4-kolumnowy grid

### Interaktywne demo (sekcja Screenshots)
Po kliknięciu mockupu otwiera się modal z mini-UI zbudowanym w vanilla HTML/CSS/JS:
- **Dashboard**: karty (staggered entry), klik Wydatki → animated bar chart, Cele → progress bar, Wyzwania → checkboxy z confetti
- **Wydarzenia**: lista z colored borders, klik zaznacza, "Dodaj wszystkie" → staggered selection → "✓ Dodano!"
- **Kalendarz**: siatka z wave animation, nawigacja miesiąca, klik dnia → przegląd z wydarzeniami

### Grafiki (`landing/assets/`)
| Plik | Użycie |
|------|--------|
| `modelka_smartme_header.png` | Hero section |
| `modelka_smartme_1.png` | Life OS section |
| `modelka_smartme_2.png` | Download CTA section |
| `logo-smartme.png` | Navbar + Footer |
| `screen-dashboard.png` | Screenshots mockup |
| `screen-events.png` | Screenshots mockup |
| `screen-calendar.png` | Screenshots mockup |

### Kolory landing page
```css
--primary: #FF8A8A; --primary-light: #FFB6B6; --primary-dark: #FF6B6B;
--accent: #9BD5C5; --accent-light: #C5EDE4;
--text-dark: #3B4A63; --text-medium: #5A6B82;  /* NIE czarny */
--gradient-hero: linear-gradient(135deg, #FFF0F0 0%, #FFF8F5 50%, #F0FFF8 100%);
```

### Mobile floating cards (Hero)
- Desktop: 4 floating cards wokół modelki (Zakupy, Cel, Wydatki, Wyzwanie)
- Mobile: tylko Cel (left) i Zakupy (right), scale 0.7, ukryte Wydatki i Wyzwanie

## Deploy na serwer produkcyjny

### Infrastruktura
- **VPS**: Hetzner CX23, Ubuntu, `89.167.123.192`
- **Domena**: `smartme.life` (landing) + `app.smartme.life` (web app), oba DNS A record → VPS IP
- **SSL**: Let's Encrypt (certbot), certyfikat SAN: `smartme.life` + `app.smartme.life`
- **SSH**: `ssh root@89.167.123.192` (klucz ed25519 z maszyny Rafa)
- **Pliki na serwerze**: `/root/anelka/`
- **Docker Compose prod**: `docker-compose.prod.yml` (porty 80/443, frontend jako static build, certbot)
- **Env prod**: `/root/anelka/.env` (silny SECRET_KEY i DB_PASSWORD, CORS tylko https://smartme.life, RESEND_API_KEY, FRONTEND_URL=https://app.smartme.life)

### Różnice prod vs dev
| | Dev (localhost) | Prod (VPS) |
|---|---|---|
| Compose file | `docker-compose.yml` | `docker-compose.prod.yml` |
| Frontend | Vite dev server (HMR) | Static build (nginx) |
| Frontend Dockerfile | `Dockerfile` | `Dockerfile.prod` |
| Nginx config | `nginx/nginx.conf` | `nginx/nginx.prod.conf` |
| Porty | 81, 8001, 3001, 5433 | 80, 443 (SSL) |
| Landing | React `/start` route | Statyczny HTML `smartme.life` (landing/) |
| CORS | localhost:81, localhost:3001 | https://app.smartme.life |
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
ssh root@89.167.123.192 'curl -s https://smartme.life/api/health'
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
