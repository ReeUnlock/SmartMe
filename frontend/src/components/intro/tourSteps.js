const tourSteps = [
  {
    isWelcome: true,
    targetId: null,
    icon: null,
    title: "Stworzone z my\u015Bl\u0105 o Tobie",
    body: "SmartMe powsta\u0142o dla zapracowanych kobiet, kt\u00F3re \u017Congluj\u0105 obowi\u0105zkami, marzeniami i codzienno\u015Bci\u0105\ni zas\u0142uguj\u0105 na narz\u0119dzie, kt\u00F3re im w tym pomo\u017Ce, nie doda kolejnego zadania do listy.",
    cta: "Zaczynamy \u2728",
    color: "rose.300",
    gradient: "linear-gradient(135deg, #FCC2D7, #F9915E)",
  },
  {
    targetId: "voice-fab",
    icon: "\uD83C\uDF99\uFE0F",
    title: "Steruj g\u0142osem",
    color: "rose.400",
    gradient: "linear-gradient(135deg, #FCC2D7, #F9915E)",
    hints: [
      "Naci\u015Bnij mikrofon i powiedz co chcesz zrobi\u0107",
      "Dodasz wydarzenie, wydatek, zakupy lub cel \u2014 jednym zdaniem",
      "Dzia\u0142a w j\u0119zyku polskim, rozumie naturalne frazy",
    ],
  },
  {
    get targetId() {
      return window.innerWidth < 768 ? "bottom-nav" : "sidebar-nav";
    },
    icon: "\uD83E\uDDED",
    title: "Wszystko w jednym miejscu",
    color: "sky.400",
    hints: [
      "Kalendarz, Zakupy, Wydatki i Plany \u2014 ka\u017Cdy modu\u0142 w osobnej sekcji",
      "Dashboard pokazuje dzienny przegl\u0105d wszystkich modu\u0142\u00F3w",
      "Szybki dost\u0119p do ka\u017Cdej sekcji z paska nawigacji",
    ],
  },
  {
    targetId: "reward-bar",
    icon: "\u2728",
    title: "Zbieraj Iskry i zdobywaj poziomy",
    color: "rose.300",
    hints: [
      "Za ka\u017Cd\u0105 akcj\u0119 (dodanie wydatku, celu, afirmacji) dostajesz Iskry",
      "Awansujesz przez 10 poziom\u00F3w i odblokowujesz nowe postacie",
      "Codzienne i tygodniowe wyzwania daj\u0105 bonusowe nagrody",
    ],
  },
];

export default tourSteps;
