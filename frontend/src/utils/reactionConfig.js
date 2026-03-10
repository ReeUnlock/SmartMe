/**
 * Avatar Emotional Reactions — per-avatar personality pools & configuration.
 *
 * Each avatar has its own message pool per event type.
 * Sol: warm, bright, energizing
 * Nox: calm, soothing, grounding
 * Bloom: growth-oriented, nurturing, hopeful
 * Aura: reflective, elegant, quietly empowering
 */

// ─── Per-avatar personality pools ────────────────────────────────

const SOL_REACTIONS = {
  mood_positive: [
    { message: "Pięknie Ci dziś idzie!", emoji: "☀️" },
    { message: "Twoja energia dziś świeci!", emoji: "✨" },
    { message: "Dobry nastrój Ci służy!", emoji: "☀️" },
    { message: "Masz w sobie dużo światła.", emoji: "🌟" },
    { message: "To jest Twój dzień!", emoji: "✨" },
  ],
  mood_negative: [
    { message: "Nawet po deszczu wychodzi słońce.", emoji: "🌤️" },
    { message: "Jutro będzie jaśniej, zobaczysz.", emoji: "☀️" },
    { message: "Ciepło wróci — zawsze wraca.", emoji: "✨" },
    { message: "Jesteś silniejsza, niż myślisz.", emoji: "🌟" },
    { message: "Daj sobie chwilę ciepła.", emoji: "☀️" },
  ],
  affirmation_reveal: [
    { message: "Niech te słowa Cię ogrzeją.", emoji: "☀️" },
    { message: "Piękne słowa na piękny dzień!", emoji: "✨" },
    { message: "Weź to ciepło ze sobą.", emoji: "🌟" },
    { message: "Każde słowo ma swoją moc.", emoji: "☀️" },
  ],
  goal_completed: [
    { message: "To był dobry krok!", emoji: "☀️" },
    { message: "Świetna robota!", emoji: "✨" },
    { message: "Błyszczysz coraz jaśniej!", emoji: "🌟" },
    { message: "Brawo, kolejny cel za Tobą!", emoji: "☀️" },
    { message: "Tak się robi postępy!", emoji: "✨" },
  ],
  streak_milestone: [
    { message: "Jaka seria! Świecisz!", emoji: "☀️" },
    { message: "Twoja energia nie słabnie!", emoji: "✨" },
    { message: "Każdy dzień jaśniejszy!", emoji: "🌟" },
    { message: "Niesamowita konsekwencja!", emoji: "☀️" },
  ],
  level_up: [
    { message: "Nowy poziom! Rośniesz!", emoji: "☀️" },
    { message: "Coraz jaśniej na Twojej drodze!", emoji: "✨" },
    { message: "Awans! Ciepłe gratulacje!", emoji: "🌟" },
    { message: "Twoje światło rośnie!", emoji: "☀️" },
  ],
  avatar_unlocked: [
    { message: "Nowa postać dołączyła!", emoji: "✨" },
    { message: "Masz nowego towarzysza!", emoji: "☀️" },
    { message: "Kolekcja rośnie w blasku!", emoji: "🌟" },
    { message: "Odblokowane! Sprawdź!", emoji: "✨" },
  ],
};

const NOX_REACTIONS = {
  mood_positive: [
    { message: "Dobrze, że się uśmiechasz.", emoji: "🌙" },
    { message: "Spokojny, dobry dzień.", emoji: "💜" },
    { message: "Cieszę się razem z Tobą.", emoji: "🌙" },
    { message: "Miło widzieć Twój spokój.", emoji: "✨" },
    { message: "Piękny nastrój dziś.", emoji: "🌙" },
  ],
  mood_negative: [
    { message: "Spokojnie, to też jest postęp.", emoji: "🌙" },
    { message: "Dziś wystarczy mały krok.", emoji: "💜" },
    { message: "Dobrze, że jesteś.", emoji: "🌙" },
    { message: "Pozwól sobie na ciszę.", emoji: "✨" },
    { message: "Noc też ma swoją mądrość.", emoji: "🌙" },
    { message: "Odpoczynek to też droga.", emoji: "💜" },
  ],
  affirmation_reveal: [
    { message: "Niech te słowa Cię otulą.", emoji: "🌙" },
    { message: "Cisza pomaga je usłyszeć.", emoji: "💜" },
    { message: "Pamiętaj o tym w ciszy.", emoji: "🌙" },
    { message: "Słowa, które leczą.", emoji: "✨" },
  ],
  goal_completed: [
    { message: "Spokojny krok, ale ważny.", emoji: "🌙" },
    { message: "Cel osiągnięty. Dobrze.", emoji: "💜" },
    { message: "Każdy krok ma znaczenie.", emoji: "🌙" },
    { message: "Cicho, ale pewnie — brawo.", emoji: "✨" },
    { message: "Postęp nie musi być głośny.", emoji: "🌙" },
  ],
  streak_milestone: [
    { message: "Stała, spokojna siła.", emoji: "🌙" },
    { message: "Twoja cierpliwość przynosi owoce.", emoji: "💜" },
    { message: "Dzień po dniu, krok po kroku.", emoji: "🌙" },
    { message: "Cisza i konsekwencja.", emoji: "✨" },
  ],
  level_up: [
    { message: "Nowy poziom. Piękna droga.", emoji: "🌙" },
    { message: "Rośniesz w swoim tempie.", emoji: "💜" },
    { message: "Spokojny awans. Gratulacje.", emoji: "🌙" },
    { message: "Kolejny etap za Tobą.", emoji: "✨" },
  ],
  avatar_unlocked: [
    { message: "Nowa postać czeka w ciszy.", emoji: "🌙" },
    { message: "Ktoś nowy dołączył.", emoji: "💜" },
    { message: "Kolekcja się powiększa.", emoji: "✨" },
    { message: "Odblokowane. Odkryj.", emoji: "🌙" },
  ],
};

const BLOOM_REACTIONS = {
  mood_positive: [
    { message: "Rozkwitasz dziś pięknie!", emoji: "🌸" },
    { message: "Twoja radość jest zaraźliwa.", emoji: "🌸" },
    { message: "Piękny dzień na rozkwit!", emoji: "💮" },
    { message: "Tak trzymaj, kwitniesz!", emoji: "🌸" },
    { message: "Dobra energia Ci służy.", emoji: "🌿" },
  ],
  mood_negative: [
    { message: "Nawet kwiaty potrzebują deszczu.", emoji: "🌸" },
    { message: "To mały krok, ale ważny.", emoji: "🌿" },
    { message: "Rośniesz nawet w trudniejsze dni.", emoji: "🌸" },
    { message: "Daj sobie czas — zakwitniesz.", emoji: "💮" },
    { message: "Każdy ogród ma swoje pory.", emoji: "🌸" },
  ],
  affirmation_reveal: [
    { message: "Słowa, które pomagają rosnąć.", emoji: "🌸" },
    { message: "Niech to zakwitnie w Tobie.", emoji: "🌿" },
    { message: "Piękne nasionko na dziś.", emoji: "🌸" },
    { message: "Każda afirmacja to nowy liść.", emoji: "💮" },
  ],
  goal_completed: [
    { message: "Rozkwitasz krok po kroku!", emoji: "🌸" },
    { message: "Kolejny kwiat w Twoim ogrodzie!", emoji: "🌿" },
    { message: "Rośniesz pięknie!", emoji: "🌸" },
    { message: "To mały krok, ale ważny.", emoji: "💮" },
    { message: "Twój ogród się rozrasta!", emoji: "🌸" },
  ],
  streak_milestone: [
    { message: "Systematyczność to Twój ogród!", emoji: "🌸" },
    { message: "Każdy dzień to nowy kwiat.", emoji: "🌿" },
    { message: "Piękna seria rozkwitu!", emoji: "🌸" },
    { message: "Rośniesz z każdym dniem.", emoji: "💮" },
  ],
  level_up: [
    { message: "Nowy poziom! Nowe kwiaty!", emoji: "🌸" },
    { message: "Rozkwitasz na nowym etapie!", emoji: "🌿" },
    { message: "Awans! Piękny wzrost!", emoji: "🌸" },
    { message: "Twój ogród wchodzi na nowy poziom!", emoji: "💮" },
  ],
  avatar_unlocked: [
    { message: "Nowa postać zakwitła!", emoji: "🌸" },
    { message: "W ogrodzie pojawił się ktoś nowy!", emoji: "🌿" },
    { message: "Kolekcja kwitnie!", emoji: "🌸" },
    { message: "Odkryj nowego towarzysza!", emoji: "💮" },
  ],
};

const AURA_REACTIONS = {
  mood_positive: [
    { message: "Twoja aura dziś lśni.", emoji: "💫" },
    { message: "Czuję Twoją dobrą energię.", emoji: "✨" },
    { message: "Harmonia Ci dziś towarzyszy.", emoji: "💫" },
    { message: "Piękna równowaga.", emoji: "✨" },
    { message: "Wewnętrzny blask jest widoczny.", emoji: "💫" },
  ],
  mood_negative: [
    { message: "W Twoim tempie też jest siła.", emoji: "💫" },
    { message: "Zaufaj sobie.", emoji: "✨" },
    { message: "Nawet cisza jest formą energii.", emoji: "💫" },
    { message: "Twoja siła jest wewnątrz.", emoji: "✨" },
    { message: "To też jest część drogi.", emoji: "💫" },
  ],
  affirmation_reveal: [
    { message: "Słowa, które rezonują.", emoji: "💫" },
    { message: "Poczuj ich energię.", emoji: "✨" },
    { message: "Mądrość płynie z ciszy.", emoji: "💫" },
    { message: "Niech to zostanie z Tobą.", emoji: "✨" },
  ],
  goal_completed: [
    { message: "Jesteś bliżej niż myślisz.", emoji: "💫" },
    { message: "Twoja droga ma sens.", emoji: "✨" },
    { message: "Cel osiągnięty. Piękna energia.", emoji: "💫" },
    { message: "Każdy krok wzmacnia Twoją aurę.", emoji: "✨" },
    { message: "Siła wewnętrzna rośnie.", emoji: "💫" },
  ],
  streak_milestone: [
    { message: "Twoja energia jest stabilna.", emoji: "💫" },
    { message: "Konsekwencja wzmacnia aurę.", emoji: "✨" },
    { message: "Blask rośnie z każdym dniem.", emoji: "💫" },
    { message: "Piękna wewnętrzna siła.", emoji: "✨" },
  ],
  level_up: [
    { message: "Nowy poziom świadomości.", emoji: "💫" },
    { message: "Twoja aura się rozszerza.", emoji: "✨" },
    { message: "Głębsza mądrość, wyższy etap.", emoji: "💫" },
    { message: "Ewoluujesz pięknie.", emoji: "✨" },
  ],
  avatar_unlocked: [
    { message: "Nowa energia dołączyła.", emoji: "💫" },
    { message: "Kolekcja zyskuje nowy blask.", emoji: "✨" },
    { message: "Odblokowane. Poczuj energię.", emoji: "💫" },
    { message: "Nowa świetlista postać czeka.", emoji: "✨" },
  ],
};

// ─── Avatar personality registry ─────────────────────────────────

export const AVATAR_REACTIONS = {
  sol: SOL_REACTIONS,
  nox: NOX_REACTIONS,
  bloom: BLOOM_REACTIONS,
  aura: AURA_REACTIONS,
};

export const DEFAULT_AVATAR_KEY = "sol";

// ─── Per-avatar bubble theme tints ───────────────────────────────

export const AVATAR_BUBBLE_THEMES = {
  sol:   { bg: "linear-gradient(135deg, #FFFAF2 0%, #FFF7ED 100%)", tail: "#FFF7ED", color: "#5C4033" },
  nox:   { bg: "linear-gradient(135deg, #F8F5FF 0%, #F3EEFA 100%)", tail: "#F3EEFA", color: "#4A3860" },
  bloom: { bg: "linear-gradient(135deg, #FFF5F7 0%, #FFF0F3 100%)", tail: "#FFF0F3", color: "#5A3040" },
  aura:  { bg: "linear-gradient(135deg, #F9F5FF 0%, #F5F0FA 100%)", tail: "#F5F0FA", color: "#483858" },
};

// ─── Per-avatar affirmation label theme ─────────────────────────

export const AVATAR_LABEL_THEMES = {
  sol:   { color: "#6B3A1F", textShadow: "0 0 14px rgba(255,255,255,0.75), 0 0 28px rgba(255,220,170,0.45)" },
  nox:   { color: "#3E2D5E", textShadow: "0 0 14px rgba(255,255,255,0.75), 0 0 28px rgba(210,200,245,0.45)" },
  bloom: { color: "#7A2E4A", textShadow: "0 0 14px rgba(255,255,255,0.75), 0 0 28px rgba(255,210,230,0.45)" },
  aura:  { color: "#4A2E6A", textShadow: "0 0 14px rgba(255,255,255,0.75), 0 0 28px rgba(210,190,255,0.45)" },
};

// ─── Reaction mechanics (unchanged) ──────────────────────────────

export const REACTION_CONFIG = {
  mood_positive:      { probability: 0.4, cooldownMs: 10 * 60 * 1000 },
  mood_negative:      { probability: 0.6, cooldownMs: 10 * 60 * 1000 },
  affirmation_reveal: { probability: 0.3, cooldownMs: 15 * 60 * 1000 },
  goal_completed:     { probability: 0.8, cooldownMs: 5 * 60 * 1000 },
  streak_milestone:   { probability: 1.0, cooldownMs: 0 },
  level_up:           { probability: 1.0, cooldownMs: 0 },
  avatar_unlocked:    { probability: 1.0, cooldownMs: 0 },
};

export const MAX_PER_SESSION = 20;
export const DISPLAY_DURATION_MS = 3500;
