import {
  useEffect,
  useRef,
  useState,
} from "react";

import "./App.css";


// ======================================================
// TERMINAL AUDIO
// ======================================================

let terminalAudioContext = null;


function getAudioContext() {
  if (!terminalAudioContext) {
    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    terminalAudioContext =
      new AudioContextClass();
  }

  return terminalAudioContext;
}


async function unlockTerminalAudio() {
  try {
    const context =
      getAudioContext();

    if (
      context &&
      context.state ===
        "suspended"
    ) {
      await context.resume();
    }
  } catch {
    // Audio must never block the app.
  }
}


function playTerminalTick() {
  try {
    const context =
      getAudioContext();

    if (
      !context ||
      context.state !==
        "running"
    ) {
      return;
    }

    const oscillator =
      context.createOscillator();

    const gain =
      context.createGain();

    oscillator.type = "square";

    oscillator.frequency.value =
      720;

    gain.gain.setValueAtTime(
      0.012,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime +
        0.022
    );

    oscillator.connect(gain);

    gain.connect(
      context.destination
    );

    oscillator.start();

    oscillator.stop(
      context.currentTime +
        0.022
    );
  } catch {
    // Ignore browser audio errors.
  }
}


// ======================================================
// TYPEWRITER
// ======================================================

function TypeText({
  text,
  speed = 58,
  startDelay = 0,
  cursor = true,
  sound = false,
  audioEnabled = true,
}) {
  const [
    displayed,
    setDisplayed,
  ] = useState("");


  useEffect(() => {
    setDisplayed("");

    let interval = null;

    const timeout =
      setTimeout(() => {
        let index = 0;

        interval =
          setInterval(() => {
            index += 1;

            const character =
              text[index - 1];

            setDisplayed(
              text.slice(
                0,
                index
              )
            );

            if (
              sound &&
              audioEnabled &&
              character &&
              character !== " "
            ) {
              playTerminalTick();
            }

            if (
              index >=
              text.length
            ) {
              clearInterval(
                interval
              );
            }
          }, speed);

      }, startDelay);


    return () => {
      clearTimeout(timeout);

      if (interval) {
        clearInterval(
          interval
        );
      }
    };

  }, [
    text,
    speed,
    startDelay,
    sound,
    audioEnabled,
  ]);


  return (
    <span>
      {displayed}

      {cursor && (
        <span className="terminal-cursor">
          _
        </span>
      )}
    </span>
  );
}


// ======================================================
// TOP BAR
// ======================================================

function TopBar({
  section = "SYSTEM ONLINE",
  audioEnabled,
  toggleAudio,
}) {
  return (
    <nav className="navbar">

      <div className="brand-lockup">

        <div
          className="brand-mark"
          aria-hidden="true"
        >
          <img
            src="/brandcourt-logo.png"
            alt=""
          />
        </div>

        <div className="logo">
          BRAND
          <span>//</span>
          COURT
        </div>

      </div>


      <div className="nav-controls">

        <button
          className="audio-toggle"
          onClick={
            toggleAudio
          }
        >
          AUDIO //{" "}

          <span
            className={
              audioEnabled
                ? "audio-on"
                : "audio-off"
            }
          >
            {
              audioEnabled
                ? "ON"
                : "OFF"
            }
          </span>
        </button>


        <div className="nav-system">

          <div className="system-light" />

          <span>
            {section}
          </span>

        </div>

      </div>

    </nav>
  );
}


// ======================================================
// APP
// ======================================================

function App() {

  // ====================================================
  // MAIN STATE
  // ====================================================

  const [
    screen,
    setScreen,
  ] = useState("home");


  const [
    idea,
    setIdea,
  ] = useState("");


  const [
    answers,
    setAnswers,
  ] = useState({
    audience: "",
    alternative: "",
    difference: "",
  });


  const [
    evidenceData,
    setEvidenceData,
  ] = useState(null);


  const [
    brandDna,
    setBrandDna,
  ] = useState(null);


  const [
    directionsData,
    setDirectionsData,
  ] = useState(null);


  const [
    selectedDirection,
    setSelectedDirection,
  ] = useState(null);


  const [
    trialData,
    setTrialData,
  ] = useState(null);


  const [
    founderDecision,
    setFounderDecision,
  ] = useState(null);


  const [
    finalSystem,
    setFinalSystem,
  ] = useState(null);


  const [
    exportStatus,
    setExportStatus,
  ] = useState("");


  const [
    audioEnabled,
    setAudioEnabled,
  ] = useState(true);


  // ====================================================
  // LOADING STATE
  // ====================================================

  const [
    loadingProgress,
    setLoadingProgress,
  ] = useState(0);


  const [
    loadingInfo,
    setLoadingInfo,
  ] = useState(null);


  const [
    loadingError,
    setLoadingError,
  ] = useState("");


  const loaderRef =
    useRef(null);


  useEffect(() => {
    return () => {
      if (
        loaderRef.current
      ) {
        clearInterval(
          loaderRef.current
        );
      }
    };
  }, []);


  // ====================================================
  // AUDIO
  // ====================================================

  const toggleAudio =
    async () => {
      await unlockTerminalAudio();

      setAudioEnabled(
        (current) =>
          !current
      );
    };


  // ====================================================
  // LOADER
  // ====================================================

  const stopLoader = () => {
    if (
      loaderRef.current
    ) {
      clearInterval(
        loaderRef.current
      );

      loaderRef.current =
        null;
    }
  };


  const beginLoading = (
    info
  ) => {
    stopLoader();

    setLoadingInfo(
      info
    );

    setLoadingError("");

    setLoadingProgress(3);

    setScreen(
      "loading"
    );


    let progress = 3;


    loaderRef.current =
      setInterval(() => {
        if (
          progress < 45
        ) {
          progress += 4;
        } else if (
          progress < 70
        ) {
          progress += 2;
        } else if (
          progress < 88
        ) {
          progress += 1;
        }

        progress =
          Math.min(
            progress,
            88
          );

        setLoadingProgress(
          progress
        );

      }, 95);
  };


  const finishLoading = (
    nextScreen
  ) => {
    stopLoader();

    let progress = 88;

    const finishTimer =
      setInterval(() => {
        progress += 4;

        const next =
          Math.min(
            progress,
            100
          );

        setLoadingProgress(
          next
        );

        if (
          next >= 100
        ) {
          clearInterval(
            finishTimer
          );

          setTimeout(() => {
            setScreen(
              nextScreen
            );
          }, 120);
        }

      }, 38);
  };


  // ====================================================
  // CASE INTAKE
  // ====================================================

  const startCase =
    async () => {
      if (
        !idea.trim()
      ) {
        return;
      }

      await unlockTerminalAudio();


      beginLoading({
        code:
          "SEQ_01",

        label:
          "CASE INTAKE",

        title:
          "INITIALIZING CASE FILE",

        description:
          "Preparing founder testimony for structured analysis.",

        footnote:
          "UNVERIFIED INFERENCE PROTOCOL ACTIVE",

        returnScreen:
          "home",

        steps: [
          {
            label:
              "ACCESSING FOUNDER INPUT",
            threshold: 8,
          },

          {
            label:
              "READING IDEA STRUCTURE",
            threshold: 31,
          },

          {
            label:
              "IDENTIFYING DECISION CONTEXT",
            threshold: 57,
          },

          {
            label:
              "PREPARING INTERVIEW PROTOCOL",
            threshold: 82,
          },
        ],
      });


      setTimeout(() => {
        finishLoading(
          "interview"
        );
      }, 750);
    };


  // ====================================================
  // EVIDENCE
  // ====================================================

  const analyzeEvidence =
    async () => {
      if (
        !answers.audience.trim() ||
        !answers.alternative.trim() ||
        !answers.difference.trim()
      ) {
        return;
      }


      await unlockTerminalAudio();


      beginLoading({
        code:
          "SEQ_02",

        label:
          "EVIDENCE ANALYSIS",

        title:
          "BUILDING EVIDENCE MATRIX",

        description:
          "Separating founder testimony from assumption and unresolved uncertainty.",

        footnote:
          "INFERENCE ≠ EVIDENCE",

        returnScreen:
          "interview",

        steps: [
          {
            label:
              "ACCESSING FOUNDER TESTIMONY",
            threshold: 8,
          },

          {
            label:
              "EXTRACTING VERIFIED SIGNALS",
            threshold: 27,
          },

          {
            label:
              "ISOLATING ASSUMPTIONS",
            threshold: 47,
          },

          {
            label:
              "IDENTIFYING INFORMATION GAPS",
            threshold: 67,
          },

          {
            label:
              "COMPILING EVIDENCE MATRIX",
            threshold: 84,
          },
        ],
      });


      try {
        const response =
          await fetch(
            "http://localhost:5000/api/analyze-evidence",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  idea,
                  answers,
                }),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Evidence analysis failed."
          );
        }


        setEvidenceData(
          data
        );


        finishLoading(
          "evidence"
        );

      } catch (error) {
        stopLoader();

        setLoadingError(
          error.message ||
            "Evidence analysis failed."
        );
      }
    };


  // ====================================================
  // BRAND DNA
  // ====================================================

  const generateBrandDna =
    async () => {
      await unlockTerminalAudio();


      beginLoading({
        code:
          "SEQ_03",

        label:
          "DNA EXTRACTION",

        title:
          "EXTRACTING BRAND CORE",

        description:
          "Converting evidence into the strategic identity the brand must preserve.",

        footnote:
          "CORE IDENTITY SYNTHESIS IN PROGRESS",

        returnScreen:
          "evidence",

        steps: [
          {
            label:
              "READING EVIDENCE MATRIX",
            threshold: 8,
          },

          {
            label:
              "EXTRACTING PURPOSE",
            threshold: 25,
          },

          {
            label:
              "DEFINING AUDIENCE TRUTH",
            threshold: 43,
          },

          {
            label:
              "SYNTHESIZING PERSONALITY",
            threshold: 61,
          },

          {
            label:
              "IDENTIFYING ANTI-TRAITS",
            threshold: 76,
          },

          {
            label:
              "LOCKING BRAND PRINCIPLES",
            threshold: 86,
          },
        ],
      });


      try {
        const response =
          await fetch(
            "http://localhost:5000/api/generate-brand-dna",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  idea,
                  answers,

                  evidence:
                    evidenceData,
                }),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Brand DNA generation failed."
          );
        }


        setBrandDna(
          data
        );


        finishLoading(
          "dna"
        );

      } catch (error) {
        stopLoader();

        setLoadingError(
          error.message ||
            "Brand DNA generation failed."
        );
      }
    };


  // ====================================================
  // DIRECTIONS
  // ====================================================

  const generateDirections =
    async () => {
      await unlockTerminalAudio();


      beginLoading({
        code:
          "SEQ_04",

        label:
          "STRATEGY SYNTHESIS",

        title:
          "GENERATING POSITIONING VECTORS",

        description:
          "Creating three strategically distinct routes from the same Brand DNA.",

        footnote:
          "POSITIONING DIFFERENTIATION PROTOCOL ACTIVE",

        returnScreen:
          "dna",

        steps: [
          {
            label:
              "READING BRAND DNA",
            threshold: 8,
          },

          {
            label:
              "MAPPING STRATEGIC TENSIONS",
            threshold: 26,
          },

          {
            label:
              "GENERATING POSITIONING VECTORS",
            threshold: 45,
          },

          {
            label:
              "TESTING DIFFERENTIATION",
            threshold: 63,
          },

          {
            label:
              "IDENTIFYING STRATEGIC RISK",
            threshold: 77,
          },

          {
            label:
              "FINALIZING ROUTES",
            threshold: 86,
          },
        ],
      });


      try {
        const response =
          await fetch(
            "http://localhost:5000/api/generate-directions",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  idea,

                  evidence:
                    evidenceData,

                  brandDna,
                }),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Strategic directions failed."
          );
        }


        setDirectionsData(
          data
        );

        setSelectedDirection(
          null
        );

        setTrialData(
          null
        );

        setFounderDecision(
          null
        );

        setFinalSystem(
          null
        );


        finishLoading(
          "directions"
        );

      } catch (error) {
        stopLoader();

        setLoadingError(
          error.message ||
            "Strategic directions failed."
        );
      }
    };


  // ====================================================
  // BRAND COURT TRIAL
  // ====================================================

  const runTrial =
    async () => {
      if (
        selectedDirection ===
        null
      ) {
        return;
      }


      await unlockTerminalAudio();


      const direction =
        directionsData
          .directions[
          selectedDirection
        ];


      beginLoading({
        code:
          "SEQ_05",

        label:
          "CROSS-EXAMINATION",

        title:
          "CONVENING BRAND COURT",

        description:
          "Four independent strategic lenses are preparing to challenge the selected direction.",

        footnote:
          "ADVERSARIAL BRAND ANALYSIS ACTIVE",

        returnScreen:
          "directions",

        steps: [
          {
            label:
              "LOCKING SELECTED VECTOR",
            threshold: 8,
          },

          {
            label:
              "CUSTOMER AGENT ONLINE",
            threshold: 25,
          },

          {
            label:
              "SKEPTIC AGENT ONLINE",
            threshold: 43,
          },

          {
            label:
              "STRATEGIST AGENT ONLINE",
            threshold: 61,
          },

          {
            label:
              "OPERATOR AGENT ONLINE",
            threshold: 74,
          },

          {
            label:
              "RUNNING CROSS-EXAMINATION",
            threshold: 84,
          },
        ],
      });


      try {
        const response =
          await fetch(
            "http://localhost:5000/api/run-trial",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  idea,

                  evidence:
                    evidenceData,

                  brandDna,

                  direction,
                }),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Brand Court trial failed."
          );
        }


        setTrialData(
          data
        );


        finishLoading(
          "trial"
        );

      } catch (error) {
        stopLoader();

        setLoadingError(
          error.message ||
            "Brand Court trial failed."
        );
      }
    };


  // ====================================================
  // FOUNDER DECISION
  // ====================================================

  const openFounderDecision =
    () => {
      setFounderDecision(
        null
      );

      setScreen(
        "decision"
      );
    };


  const selectFounderDecision =
    (decision) => {
      if (
        decision ===
        "reopen"
      ) {
        setFounderDecision(
          null
        );

        setTrialData(
          null
        );

        setSelectedDirection(
          null
        );

        setScreen(
          "directions"
        );

        return;
      }


      setFounderDecision(
        decision
      );

      setFinalSystem(
        null
      );
    };


  // ====================================================
  // FINAL BRAND SYSTEM
  // ====================================================

  const generateFinalSystem =
    async () => {
      if (
        !founderDecision ||
        selectedDirection ===
          null
      ) {
        return;
      }


      await unlockTerminalAudio();


      const direction =
        directionsData
          .directions[
          selectedDirection
        ];


      beginLoading({
        code:
          "SEQ_06",

        label:
          "FINAL SYNTHESIS",

        title:
          "ASSEMBLING BRAND SYSTEM",

        description:
          "Converting the complete case history into one coherent launch-ready brand system.",

        footnote:
          "HUMAN DECISION LOCKED // FINAL SYNTHESIS ACTIVE",

        returnScreen:
          "decision",

        steps: [
          {
            label:
              "READING FOUNDER DECISION",
            threshold: 8,
          },

          {
            label:
              "RECONCILING COURT FINDINGS",
            threshold: 24,
          },

          {
            label:
              "GENERATING BRAND NAME SYSTEM",
            threshold: 40,
          },

          {
            label:
              "BUILDING MESSAGING SYSTEM",
            threshold: 55,
          },

          {
            label:
              "DEFINING VOICE + IDENTITY",
            threshold: 69,
          },

          {
            label:
              "ASSEMBLING LAUNCH SYSTEM",
            threshold: 81,
          },

          {
            label:
              "LOCKING FINAL BRAND SYSTEM",
            threshold: 87,
          },
        ],
      });


      try {
        const response =
          await fetch(
            "http://localhost:5000/api/generate-final-system",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify({
                  idea,

                  evidence:
                    evidenceData,

                  brandDna,

                  direction,

                  trial:
                    trialData,

                  founderDecision,
                }),
            }
          );


        const data =
          await response.json();


        if (
          !response.ok ||
          !data.success
        ) {
          throw new Error(
            data.error ||
              "Final Brand System generation failed."
          );
        }


        setFinalSystem(
          data
        );


        finishLoading(
          "final"
        );

      } catch (error) {
        stopLoader();

        setLoadingError(
          error.message ||
            "Final Brand System generation failed."
        );
      }
    };


  // ====================================================
  // HOME
  // ====================================================

  if (
    screen === "home"
  ) {
    return (
      <div className="app">

        <TopBar
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="home-shell">

          <div className="hud-meta">
            <span>
              BC://CORE/ONLINE
            </span>

            <span>
              INTELLIGENCE SYSTEM
            </span>
          </div>


          <section className="hero">

            <div className="home-brand-emblem">
              <img
                src="/brandcourt-logo.png"
                alt="Brand Court — Since 2026"
              />
            </div>


            <div className="system-kicker">
              CASE INTELLIGENCE ENGINE
            </div>


            <h1>

              <TypeText
                text="DON'T JUST BUILD"
                speed={72}
                cursor={false}
              />

              <br />

              <TypeText
                text="A BRAND."
                speed={82}
                startDelay={1250}
                cursor={false}
              />

              <br />

              <span>
                <TypeText
                  text="MAKE IT DEFEND ITSELF."
                  speed={64}
                  startDelay={2150}
                />
              </span>

            </h1>


            <p className="hero-copy">
              AI-powered strategic interrogation
              for founders building brands that
              need to survive scrutiny.
            </p>


            <div className="terminal-note">
              <span>
                SYSTEM OBJECTIVE
              </span>

              Discover → Verify →
              Define → Position →
              Challenge → Deliver
            </div>

          </section>


          <section className="input-console">

            <div className="console-header">

              <div>
                <span>
                  CASE_INPUT
                </span>

                <strong>
                  NEW FOUNDER CONCEPT
                </strong>
              </div>


              <div className="console-status">
                READY
              </div>

            </div>


            <textarea
              value={idea}

              onChange={(
                event
              ) =>
                setIdea(
                  event.target.value
                )
              }

              placeholder="> Describe your product, startup, service, community, or creator idea..."
            />


            <div className="console-footer">

              <span>
                INPUT CHANNEL SECURE
              </span>


              <button
                className="primary-button"

                disabled={
                  !idea.trim()
                }

                onClick={
                  startCase
                }
              >
                INITIALIZE CASE →
              </button>

            </div>

          </section>


          <div className="bottom-system-bar">
            <span>
              AI CORE // ACTIVE
            </span>

            <span>
              EVIDENCE PROTOCOL // ENABLED
            </span>

            <span>
              BUILD // BC-1.0
            </span>
          </div>

        </main>

      </div>
    );
  }


  // ====================================================
  // LOADING
  // ====================================================

  if (
    screen === "loading"
  ) {
    const steps =
      loadingInfo?.steps ||
      [];


    return (
      <div className="app">

        <TopBar
          section="PROCESSING"
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="loading-shell">

          <div className="loader-code">
            {
              loadingInfo?.code
            }
          </div>


          <div className="system-kicker">
            {
              loadingInfo?.label
            }
          </div>


          <h2 className="terminal-title">

            <TypeText
              text={
                loadingInfo?.title ||
                "PROCESSING"
              }

              speed={48}

              sound={true}

              audioEnabled={
                audioEnabled
              }
            />

          </h2>


          <p className="loading-description">
            {
              loadingInfo?.description
            }
          </p>


          <div className="analysis-terminal">

            <div className="terminal-toolbar">

              <span>
                BRAND//COURT CORE
              </span>

              <span>
                RUNNING
              </span>

            </div>


            <div className="terminal-lines">

              {steps.map(
                (
                  step,
                  index
                ) => {
                  const complete =
                    loadingProgress >=
                    step.threshold;

                  return (
                    <div
                      className={
                        complete
                          ? "terminal-line complete"
                          : "terminal-line"
                      }

                      key={
                        index
                      }
                    >

                      <span className="terminal-prefix">
                        &gt;
                      </span>


                      <span className="terminal-command">
                        {
                          step.label
                        }
                      </span>


                      <span className="terminal-dots">
                        ................
                      </span>


                      <span className="terminal-state">
                        {
                          complete
                            ? "COMPLETE"
                            : "WAITING"
                        }
                      </span>

                    </div>
                  );
                }
              )}

            </div>


            <div className="progress-area">

              <div className="progress-track">

                <div
                  className="progress-fill"

                  style={{
                    width:
                      `${loadingProgress}%`,
                  }}
                />

              </div>


              <div className="progress-readout">

                <span>
                  ANALYSIS_PROGRESS
                </span>

                <strong>
                  {String(
                    loadingProgress
                  ).padStart(
                    3,
                    "0"
                  )}
                  %
                </strong>

              </div>

            </div>

          </div>


          <div className="loader-footnote">
            <span className="warning-dot" />

            {
              loadingInfo?.footnote
            }
          </div>


          {loadingError && (

            <div className="system-error">

              <span>
                SYSTEM INTERRUPTION
              </span>

              <strong>
                Analysis sequence failed.
              </strong>

              <p>
                {
                  loadingError
                }
              </p>


              <button
                onClick={() =>
                  setScreen(
                    loadingInfo
                      ?.returnScreen ||
                    "home"
                  )
                }
              >
                RETURN TO PREVIOUS MODULE →
              </button>

            </div>

          )}

        </main>

      </div>
    );
  }


  // ====================================================
  // INTERVIEW
  // ====================================================

  if (
    screen === "interview"
  ) {
    const complete =
      answers.audience.trim() &&
      answers.alternative.trim() &&
      answers.difference.trim();


    const questions = [
      {
        id: "01",

        title:
          "WHO EXACTLY ARE YOU BUILDING THIS FOR?",

        helper:
          "Describe the intended users as precisely as you currently can.",

        key:
          "audience",

        placeholder:
          "> Define intended audience...",
      },

      {
        id: "02",

        title:
          "WHAT DO THESE PEOPLE DO RIGHT NOW INSTEAD?",

        helper:
          "Describe their current behaviour, workaround, or alternative.",

        key:
          "alternative",

        placeholder:
          "> Describe current behaviour...",
      },

      {
        id: "03",

        title:
          "WHY SHOULD THEY CHOOSE YOUR SOLUTION?",

        helper:
          "State the difference you believe matters most.",

        key:
          "difference",

        placeholder:
          "> State proposed difference...",
      },
    ];


    return (
      <div className="app">

        <TopBar
          section="FOUNDER INTERVIEW"
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "home"
              )
            }
          >
            ← RETURN
          </button>


          <div className="page-code">
            BC://CASE/001
          </div>


          <div className="system-kicker">
            STAGE 01 // DISCOVER
          </div>


          <h2 className="page-title">
            <TypeText
              text="BEFORE STRATEGY, TESTIFY."
              speed={55}
              sound={true}
              audioEnabled={
                audioEnabled
              }
            />
          </h2>


          <p className="page-description">
            Brand Court requires the founder's
            own account before strategic
            inference begins.
          </p>


          <div className="interview-console">

            {questions.map(
              (
                question
              ) => (

                <section
                  className="interview-row"

                  key={
                    question.id
                  }
                >

                  <div className="question-id">
                    Q_
                    {
                      question.id
                    }
                  </div>


                  <div className="question-copy">

                    <h3>
                      {
                        question.title
                      }
                    </h3>

                    <p>
                      {
                        question.helper
                      }
                    </p>

                  </div>


                  <textarea
                    value={
                      answers[
                        question.key
                      ]
                    }

                    onChange={(
                      event
                    ) =>
                      setAnswers({
                        ...answers,

                        [
                          question.key
                        ]:
                          event.target
                            .value,
                      })
                    }

                    placeholder={
                      question.placeholder
                    }
                  />

                </section>

              )
            )}

          </div>


          <div className="action-row">

            <span>
              TESTIMONY STATUS:
              {
                complete
                  ? " COMPLETE"
                  : " INCOMPLETE"
              }
            </span>


            <button
              className="primary-button"

              disabled={
                !complete
              }

              onClick={
                analyzeEvidence
              }
            >
              BUILD EVIDENCE MATRIX →
            </button>

          </div>

        </main>

      </div>
    );
  }


  // ====================================================
  // EVIDENCE
  // ====================================================

  if (
    screen === "evidence" &&
    evidenceData
  ) {
    return (
      <div className="app">

        <TopBar
          section="EVIDENCE MATRIX"
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "interview"
              )
            }
          >
            ← RETURN
          </button>


          <div className="page-code">
            BC://CASE/001/EVIDENCE
          </div>


          <div className="system-kicker">
            STAGE 02 // VERIFY
          </div>


          <h2 className="page-title">
            <TypeText
              text="SEPARATE SIGNAL FROM BELIEF."
              speed={52}
              sound={true}
              audioEnabled={
                audioEnabled
              }
            />
          </h2>


          <p className="page-description">
            Founder testimony has been classified
            into confirmed information, unverified
            assumptions and unresolved strategic
            questions.
          </p>


          {evidenceData.provisional && (
            <div className="system-warning">

              <strong>
                PROVISIONAL ANALYSIS
              </strong>

              <p>
                AI analysis was temporarily
                unavailable. This matrix was
                assembled from founder-supplied
                information.
              </p>

            </div>
          )}


          <section className="summary-panel">

            <div className="panel-header">

              <span>
                CASE SUMMARY
              </span>

              <span>
                AUTO-GENERATED
              </span>

            </div>


            <div className="summary-grid">

              <div>
                <span>
                  PRODUCT TYPE
                </span>

                <p>
                  {
                    evidenceData
                      .caseSummary
                      .productType
                  }
                </p>
              </div>


              <div>
                <span>
                  CORE PROBLEM
                </span>

                <p>
                  {
                    evidenceData
                      .caseSummary
                      .coreProblem
                  }
                </p>
              </div>


              <div>
                <span>
                  AUDIENCE
                </span>

                <p>
                  {
                    evidenceData
                      .caseSummary
                      .audience
                  }
                </p>
              </div>


              <div>
                <span>
                  PROPOSED VALUE
                </span>

                <p>
                  {
                    evidenceData
                      .caseSummary
                      .proposedValue
                  }
                </p>
              </div>

            </div>

          </section>


          <div className="evidence-grid">

            <section className="evidence-sector known-sector">

              <div className="sector-header">
                <span>
                  01
                </span>

                <h3>
                  KNOWN
                </h3>
              </div>


              <p className="sector-description">
                Directly supported by founder
                testimony.
              </p>


              {evidenceData.known.map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="signal-card"

                    key={
                      index
                    }
                  >
                    <span>
                      {
                        item.label
                      }
                    </span>

                    <p>
                      {
                        item.statement
                      }
                    </p>
                  </article>

                )
              )}

            </section>


            <section className="evidence-sector assumed-sector">

              <div className="sector-header">
                <span>
                  02
                </span>

                <h3>
                  ASSUMED
                </h3>
              </div>


              <p className="sector-description">
                Plausible, but not yet validated.
              </p>


              {evidenceData.assumptions.map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="signal-card"

                    key={
                      index
                    }
                  >
                    <span>
                      {
                        item.label
                      }
                    </span>

                    <p>
                      {
                        item.statement
                      }
                    </p>


                    <div className="signal-reason">
                      <small>
                        UNVERIFIED BECAUSE
                      </small>

                      <p>
                        {
                          item.reason
                        }
                      </p>
                    </div>

                  </article>

                )
              )}

            </section>


            <section className="evidence-sector unknown-sector">

              <div className="sector-header">
                <span>
                  03
                </span>

                <h3>
                  UNKNOWN
                </h3>
              </div>


              <p className="sector-description">
                Questions still capable of
                changing strategy.
              </p>


              {evidenceData.unknowns.map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="signal-card"

                    key={
                      index
                    }
                  >
                    <span>
                      {
                        item.label
                      }
                    </span>

                    <p>
                      {
                        item.question
                      }
                    </p>
                  </article>

                )
              )}

            </section>

          </div>


          <div className="action-row">

            <span>
              EVIDENCE MATRIX // COMPILED
            </span>


            <button
              className="primary-button"

              onClick={
                generateBrandDna
              }
            >
              EXTRACT BRAND DNA →
            </button>

          </div>

        </main>

      </div>
    );
  }


  // ====================================================
  // DNA
  // ====================================================

  if (
    screen === "dna" &&
    brandDna
  ) {
    return (
      <div className="app">

        <TopBar
          section="BRAND DNA"
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "evidence"
              )
            }
          >
            ← RETURN
          </button>


          <div className="page-code">
            BC://CASE/001/DNA
          </div>


          <div className="system-kicker">
            STAGE 03 // DEFINE
          </div>


          <h2 className="page-title">
            <TypeText
              text="DEFINE WHAT MUST NEVER BE LOST."
              speed={52}
              sound={true}
              audioEnabled={
                audioEnabled
              }
            />
          </h2>


          <p className="page-description">
            The evidence matrix has been translated
            into an internal strategic identity.
          </p>


          {brandDna.provisional && (
            <div className="system-warning">

              <strong>
                PROVISIONAL DNA
              </strong>

              <p>
                The AI service was temporarily
                unavailable. This DNA was derived
                from the existing evidence fallback.
              </p>

            </div>
          )}


          <div className="dna-core-grid">

            <article className="core-module">
              <span>
                DNA_01
              </span>

              <h3>
                PURPOSE
              </h3>

              <p>
                {
                  brandDna.purpose
                }
              </p>
            </article>


            <article className="core-module">
              <span>
                DNA_02
              </span>

              <h3>
                AUDIENCE TRUTH
              </h3>

              <p>
                {
                  brandDna.audienceTruth
                }
              </p>
            </article>


            <article className="core-module highlighted">
              <span>
                DNA_03
              </span>

              <h3>
                CORE PROMISE
              </h3>

              <p>
                {
                  brandDna.corePromise
                }
              </p>
            </article>

          </div>


          <section className="data-panel">

            <div className="panel-header">
              <span>
                PERSONALITY MATRIX
              </span>

              <span>
                {
                  brandDna
                    .personality
                    .length
                }{" "}
                SIGNALS
              </span>
            </div>


            <div className="trait-grid">

              {brandDna.personality.map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="trait-module"

                    key={
                      index
                    }
                  >
                    <span>
                      P_
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <h4>
                      {
                        item.trait
                      }
                    </h4>

                    <p>
                      {
                        item.reason
                      }
                    </p>
                  </article>

                )
              )}

            </div>

          </section>


          <section className="data-panel danger-panel">

            <div className="panel-header">
              <span>
                ANTI-PERSONALITY
              </span>

              <span>
                AVOID
              </span>
            </div>


            <div className="anti-grid">

              {brandDna.antiPersonality.map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="anti-module"

                    key={
                      index
                    }
                  >
                    <div className="danger-icon">
                      ×
                    </div>

                    <div>
                      <h4>
                        {
                          item.trait
                        }
                      </h4>

                      <p>
                        {
                          item.reason
                        }
                      </p>
                    </div>
                  </article>

                )
              )}

            </div>

          </section>


          <section className="data-panel">

            <div className="panel-header">
              <span>
                BRAND OPERATING PRINCIPLES
              </span>

              <span>
                LOCKED
              </span>
            </div>


            <div className="principles-list">

              {brandDna.principles.map(
                (
                  item,
                  index
                ) => (

                  <article
                    className="principle-row"

                    key={
                      index
                    }
                  >
                    <span>
                      RULE_
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                    </span>

                    <div>
                      <h4>
                        {
                          item.title
                        }
                      </h4>

                      <p>
                        {
                          item.rule
                        }
                      </p>
                    </div>
                  </article>

                )
              )}

            </div>

          </section>


          <div className="lock-message">

            <div className="lock-symbol">
              ◈
            </div>

            <div>
              <span>
                DNA LOCK CONFIRMED
              </span>

              <p>
                Future strategic directions
                must remain consistent with
                this identity.
              </p>
            </div>

          </div>


          <div className="action-row">

            <span>
              CORE IDENTITY // LOCKED
            </span>


            <button
              className="primary-button"

              onClick={
                generateDirections
              }
            >
              GENERATE STRATEGIC VECTORS →
            </button>

          </div>

        </main>

      </div>
    );
  }


  // ====================================================
  // DIRECTIONS
  // ====================================================

  if (
    screen === "directions" &&
    directionsData
  ) {
    return (
      <div className="app">

        <TopBar
          section="POSITIONING"
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "dna"
              )
            }
          >
            ← RETURN
          </button>


          <div className="page-code">
            BC://CASE/001/POSITION
          </div>


          <div className="system-kicker">
            STAGE 04 // POSITION
          </div>


          <h2 className="page-title">
            <TypeText
              text="THREE VECTORS. ONE BRAND CORE."
              speed={52}
              sound={true}
              audioEnabled={
                audioEnabled
              }
            />
          </h2>


          <p className="page-description">
            Three strategically distinct territories
            have been generated. Select one to enter
            cross-examination.
          </p>


          {directionsData.provisional && (
            <div className="system-warning">

              <strong>
                PROVISIONAL STRATEGY
              </strong>

              <p>
                Strategy generation fell back
                to the existing Brand DNA.
              </p>

            </div>
          )}


          <div className="direction-grid">

            {directionsData.directions.map(
              (
                direction,
                index
              ) => {
                const selected =
                  selectedDirection ===
                  index;

                return (
                  <article
                    className={
                      selected
                        ? "direction-module selected"
                        : "direction-module"
                    }

                    key={
                      index
                    }
                  >

                    <div className="direction-index">

                      <span>
                        VECTOR_
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <span>
                        {
                          selected
                            ? "LOCKED"
                            : "AVAILABLE"
                        }
                      </span>

                    </div>


                    <h3>
                      {
                        direction.name
                      }
                    </h3>


                    <p className="direction-thesis">
                      {
                        direction.thesis
                      }
                    </p>


                    <div className="direction-data">

                      <section>
                        <span>
                          POSITIONING
                        </span>

                        <p>
                          {
                            direction.positioning
                          }
                        </p>
                      </section>


                      <section>
                        <span>
                          CENTRAL TENSION
                        </span>

                        <p>
                          {
                            direction.centralTension
                          }
                        </p>
                      </section>


                      <section>
                        <span>
                          CORE PROMISE
                        </span>

                        <p>
                          {
                            direction.corePromise
                          }
                        </p>
                      </section>

                    </div>


                    <div className="trait-chips">

                      {direction.personalityEmphasis.map(
                        (
                          trait,
                          traitIndex
                        ) => (
                          <span
                            key={
                              traitIndex
                            }
                          >
                            {
                              trait
                            }
                          </span>
                        )
                      )}

                    </div>


                    <div className="message-terminal">

                      <span>
                        MESSAGING TERRITORY
                      </span>

                      <strong>
                        {
                          direction.messagingTerritory
                        }
                      </strong>

                    </div>


                    <div className="direction-analysis">

                      <div>
                        <span>
                          WHY IT WORKS
                        </span>

                        <p>
                          {
                            direction.whyItWorks
                          }
                        </p>
                      </div>


                      <div className="risk-analysis">
                        <span>
                          STRATEGIC RISK
                        </span>

                        <p>
                          {
                            direction.strategicRisk
                          }
                        </p>
                      </div>

                    </div>


                    <button
                      className={
                        selected
                          ? "vector-button selected"
                          : "vector-button"
                      }

                      onClick={() =>
                        setSelectedDirection(
                          index
                        )
                      }
                    >
                      {
                        selected
                          ? "VECTOR LOCKED ✓"
                          : "LOCK THIS VECTOR →"
                      }
                    </button>

                  </article>
                );
              }
            )}

          </div>


          {selectedDirection !==
            null && (

            <section className="trial-launch">

              <div className="trial-grid-line" />


              <div className="trial-copy">

                <span>
                  TRIAL SEQUENCE READY
                </span>

                <h3>
                  {
                    directionsData
                      .directions[
                      selectedDirection
                    ].name
                  }
                </h3>

                <p>
                  Selected strategic vector
                  will now face four independent
                  AI critics.
                </p>

              </div>


              <div className="agent-list">

                <span>
                  CUSTOMER
                  <b>READY</b>
                </span>

                <span>
                  SKEPTIC
                  <b>READY</b>
                </span>

                <span>
                  STRATEGIST
                  <b>READY</b>
                </span>

                <span>
                  OPERATOR
                  <b>READY</b>
                </span>

              </div>


              <button
                className="trial-button"
                onClick={
                  runTrial
                }
              >
                PUT THIS BRAND ON TRIAL ⚖
              </button>

            </section>

          )}

        </main>

      </div>
    );
  }


  // ====================================================
  // BRAND COURT TRIAL
  // ====================================================

  if (
    screen === "trial" &&
    trialData &&
    selectedDirection !==
      null
  ) {

    const direction =
      directionsData
        .directions[
        selectedDirection
      ];


    const agents = [
      {
        code:
          "AGENT_01",

        name:
          "CUSTOMER",

        question:
          "WOULD I ACTUALLY CARE?",

        data:
          trialData
            .agents
            .customer,
      },

      {
        code:
          "AGENT_02",

        name:
          "SKEPTIC",

        question:
          "WHAT ARE YOU ASSUMING?",

        data:
          trialData
            .agents
            .skeptic,
      },

      {
        code:
          "AGENT_03",

        name:
          "STRATEGIST",

        question:
          "IS THIS STRATEGICALLY DISTINCT?",

        data:
          trialData
            .agents
            .strategist,
      },

      {
        code:
          "AGENT_04",

        name:
          "OPERATOR",

        question:
          "CAN YOU ACTUALLY DELIVER THIS?",

        data:
          trialData
            .agents
            .operator,
      },
    ];


    const classificationClass =
      trialData
        .courtFinding
        .classification
        .toLowerCase()
        .replaceAll(
          " ",
          "-"
        );


    return (
      <div className="app trial-app">

        <TopBar
          section="COURT IN SESSION"
          audioEnabled={
            audioEnabled
          }
          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell trial-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "directions"
              )
            }
          >
            ← RETURN TO POSITIONING
          </button>


          <div className="page-code">
            BC://CASE/001/TRIAL
          </div>


          <div className="system-kicker">
            STAGE 05 // CHALLENGE
          </div>


          <h2 className="page-title trial-title">

            <TypeText
              text="THE COURT IS NOW IN SESSION."
              speed={57}
              sound={true}
              audioEnabled={
                audioEnabled
              }
            />

          </h2>


          <p className="page-description">
            The selected strategic direction is
            being examined from four independent
            decision lenses.
          </p>


          <section className="trial-case-banner">

            <span>
              STRATEGIC VECTOR UNDER REVIEW
            </span>

            <h3>
              {
                direction.name
              }
            </h3>

            <p>
              {
                direction.positioning
              }
            </p>

          </section>


          {trialData.provisional && (
            <div className="system-warning">

              <strong>
                PROVISIONAL COURT SESSION
              </strong>

              <p>
                AI analysis was temporarily
                unavailable. The system used its
                structured trial fallback.
              </p>

            </div>
          )}


          <div className="trial-agent-grid">

            {agents.map(
              (
                agent,
                index
              ) => (

                <article
                  className="trial-agent-card"

                  style={{
                    animationDelay:
                      `${index * 0.28}s`,
                  }}

                  key={
                    agent.name
                  }
                >

                  <div className="agent-card-header">

                    <div>
                      <span>
                        {
                          agent.code
                        }
                      </span>

                      <h3>
                        {
                          agent.name
                        }
                      </h3>
                    </div>


                    <div className="agent-online">
                      ● ONLINE
                    </div>

                  </div>


                  <div className="agent-question">
                    {
                      agent.question
                    }
                  </div>


                  <h4 className="agent-headline">
                    {
                      agent.data
                        .headline
                    }
                  </h4>


                  <p className="agent-perspective">
                    {
                      agent.data
                        .perspective
                    }
                  </p>


                  <div className="court-section">

                    <span>
                      OBJECTIONS
                    </span>


                    <div className="objection-list">

                      {agent.data
                        .objections
                        .map(
                          (
                            objection,
                            objectionIndex
                          ) => (

                            <div
                              className="objection-item"

                              key={
                                objectionIndex
                              }
                            >
                              <b>
                                !
                              </b>

                              <p>
                                {
                                  objection
                                }
                              </p>
                            </div>

                          )
                        )}

                    </div>

                  </div>


                  <div className="cross-exam-box">

                    <span>
                      CROSS-EXAMINATION
                    </span>

                    <p>
                      {
                        agent.data
                          .crossExamination
                      }
                    </p>

                  </div>


                  <div className="approval-condition">

                    <span>
                      CONDITION FOR APPROVAL
                    </span>

                    <p>
                      {
                        agent.data
                          .conditionForApproval
                      }
                    </p>

                  </div>

                </article>

              )
            )}

          </div>


          <section
            className="court-finding"
          >

            <div className="finding-code">
              COURT_FINDING // FINAL
            </div>


            <div
              className={`finding-classification ${classificationClass}`}
            >
              {
                trialData
                  .courtFinding
                  .classification
              }
            </div>


            <p className="finding-summary">
              {
                trialData
                  .courtFinding
                  .summary
              }
            </p>


            <div className="finding-grid">

              <article>

                <span>
                  STRONGEST DEFENSE
                </span>

                <p>
                  {
                    trialData
                      .courtFinding
                      .strongestElement
                  }
                </p>

              </article>


              <article>

                <span>
                  PRIMARY PRESSURE POINT
                </span>

                <p>
                  {
                    trialData
                      .courtFinding
                      .weakestElement
                  }
                </p>

              </article>

            </div>


            <div className="court-lists">

              <div>

                <span>
                  PRESERVE
                </span>


                {trialData
                  .courtFinding
                  .preserve
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        <b>
                          +
                        </b>{" "}
                        {item}
                      </p>
                    )
                  )}

              </div>


              <div>

                <span>
                  REQUIRED REVISIONS
                </span>


                {trialData
                  .courtFinding
                  .requiredRevisions
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        <b>
                          !
                        </b>{" "}
                        {item}
                      </p>
                    )
                  )}

              </div>

            </div>


            <div className="court-footer">

              <span>
                COURT SESSION COMPLETE
              </span>


              <button
                className="primary-button"

                onClick={
                  openFounderDecision
                }
              >
                REVIEW FOUNDER DECISION →
              </button>

            </div>

          </section>

        </main>

      </div>
    );
  }



  // ====================================================
  // FOUNDER DECISION
  // ====================================================

  if (
    screen === "decision" &&
    trialData &&
    selectedDirection !==
      null
  ) {

    const direction =
      directionsData
        .directions[
        selectedDirection
      ];


    const finding =
      trialData
        .courtFinding;


    const acceptSelected =
      founderDecision ===
      "accept";


    const defendSelected =
      founderDecision ===
      "defend";


    return (
      <div className="app">

        <TopBar
          section="FOUNDER DECISION"

          audioEnabled={
            audioEnabled
          }

          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell decision-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "trial"
              )
            }
          >
            ← RETURN TO COURT
          </button>


          <div className="page-code">
            BC://CASE/001/DECISION
          </div>


          <div className="system-kicker">
            STAGE 06 // DECIDE
          </div>


          <h2 className="page-title">

            <TypeText
              text="THE COURT HAS SPOKEN. YOU DECIDE."

              speed={55}

              sound={true}

              audioEnabled={
                audioEnabled
              }
            />

          </h2>


          <p className="page-description">
            Brand Court can challenge a strategy.
            It cannot make the founder&apos;s decision.
          </p>


          <section className="decision-verdict">

            <span className="decision-label">
              COURT FINDING
            </span>


            <h3
              className={
                `decision-finding ${
                  finding.classification
                    .toLowerCase()
                    .replaceAll(
                      " ",
                      "-"
                    )
                }`
              }
            >
              {
                finding.classification
              }
            </h3>


            <p>
              {
                finding.summary
              }
            </p>


            <div className="decision-vector">

              <span>
                VECTOR UNDER REVIEW
              </span>

              <strong>
                {
                  direction.name
                }
              </strong>

            </div>

          </section>


          <section className="founder-authority">

            <div className="authority-symbol">
              ◈
            </div>


            <span>
              FOUNDER AUTHORITY
            </span>


            <h3>
              COURT ADVISES.
              <br />
              FOUNDER DECIDES.
            </h3>


            <p>
              Choose how the court&apos;s findings
              should influence the final
              brand system.
            </p>

          </section>


          <div className="decision-grid">

            <article
              className={
                acceptSelected
                  ? "decision-card selected"
                  : "decision-card"
              }

              onClick={() =>
                selectFounderDecision(
                  "accept"
                )
              }
            >

              <div className="decision-number">
                01
              </div>


              <div className="decision-status">
                {
                  acceptSelected
                    ? "SELECTED"
                    : "AVAILABLE"
                }
              </div>


              <h3>
                ACCEPT REVISIONS
              </h3>


              <p>
                Preserve the strongest parts
                of the chosen vector while
                allowing the court&apos;s required
                revisions to shape the final
                brand system.
              </p>


              <div className="decision-impact">

                <span>
                  FINAL SYSTEM BEHAVIOUR
                </span>


                <strong>
                  Incorporate court findings
                  before generating the final
                  identity.
                </strong>

              </div>


              <button
                className="decision-select-button"
                type="button"
              >
                {
                  acceptSelected
                    ? "DECISION SELECTED ✓"
                    : "SELECT THIS PATH →"
                }
              </button>

            </article>


            <article
              className={
                defendSelected
                  ? "decision-card selected"
                  : "decision-card"
              }

              onClick={() =>
                selectFounderDecision(
                  "defend"
                )
              }
            >

              <div className="decision-number">
                02
              </div>


              <div className="decision-status">
                {
                  defendSelected
                    ? "SELECTED"
                    : "AVAILABLE"
                }
              </div>


              <h3>
                DEFEND VECTOR
              </h3>


              <p>
                Keep the selected strategic
                direction unchanged. The
                court&apos;s objections remain
                visible as risks rather than
                altering the strategy.
              </p>


              <div className="decision-impact">

                <span>
                  FINAL SYSTEM BEHAVIOUR
                </span>


                <strong>
                  Preserve the original
                  strategic vector and record
                  unresolved pressure points.
                </strong>

              </div>


              <button
                className="decision-select-button"
                type="button"
              >
                {
                  defendSelected
                    ? "DECISION SELECTED ✓"
                    : "SELECT THIS PATH →"
                }
              </button>

            </article>


            <article
              className="decision-card reopen-card"

              onClick={() =>
                selectFounderDecision(
                  "reopen"
                )
              }
            >

              <div className="decision-number">
                03
              </div>


              <div className="decision-status">
                RETURN
              </div>


              <h3>
                REOPEN POSITIONING
              </h3>


              <p>
                Reject the current strategic
                direction and return to the
                three positioning vectors.
              </p>


              <div className="decision-impact">

                <span>
                  SYSTEM BEHAVIOUR
                </span>


                <strong>
                  Clear the current vector
                  and conduct another
                  strategic trial.
                </strong>

              </div>


              <button
                className="decision-select-button"
                type="button"
              >
                RETURN TO VECTORS →
              </button>

            </article>

          </div>


          {founderDecision && (

            <section className="decision-confirmation">

              <span>
                FOUNDER DECISION RECORDED
              </span>


              <h3>
                {
                  founderDecision ===
                  "accept"
                    ? "COURT REVISIONS WILL INFORM THE FINAL SYSTEM."
                    : "ORIGINAL STRATEGIC VECTOR WILL BE PRESERVED."
                }
              </h3>


              <p>
                {
                  founderDecision ===
                  "accept"
                    ? "The final Brand System will preserve the selected strategy's strongest elements while responding to the court's required revisions."
                    : "The final Brand System will follow the founder's selected vector without rewriting it. Court objections will remain documented as strategic risks."
                }
              </p>


              <button
                className="primary-button"

                onClick={
                  generateFinalSystem
                }
              >
                BUILD FINAL BRAND SYSTEM →
              </button>

            </section>

          )}


          <div className="decision-footer">

            <span>
              AI RECOMMENDATION // ADVISORY
            </span>

            <span>
              HUMAN DECISION // AUTHORITATIVE
            </span>

          </div>

        </main>

      </div>
    );
  }


  // ====================================================
  // FINAL BRAND SYSTEM
  // ====================================================

  if (
    screen === "final" &&
    finalSystem &&
    selectedDirection !==
      null
  ) {

    const direction =
      directionsData
        .directions[
        selectedDirection
      ];


    const decisionLabel =
      founderDecision ===
      "accept"
        ? "COURT REVISIONS ACCEPTED"
        : "ORIGINAL VECTOR DEFENDED";


    const listLines =
      (items = []) =>
        items
          .map(
            (item) =>
              `- ${item}`
          )
          .join("\n");


    const buildExportText =
      () => {

        const system =
          finalSystem;

        return [
          "BRAND//COURT",
          "FINAL BRAND SYSTEM",
          "========================================",
          "",
          `RECOMMENDED NAME: ${system.naming.primaryName}`,
          `RATIONALE: ${system.naming.rationale}`,
          "",
          "ALTERNATE NAMES",
          listLines(
            system.naming.alternates
          ),
          "",
          "FINAL BRAND CORE",
          "----------------------------------------",
          `Positioning: ${system.finalCore.positioning}`,
          `Purpose: ${system.finalCore.purpose}`,
          `Audience: ${system.finalCore.audience}`,
          `Core Promise: ${system.finalCore.corePromise}`,
          "",
          "MESSAGING SYSTEM",
          "----------------------------------------",
          `Primary Tagline: ${system.messaging.primaryTagline}`,
          "",
          "Alternate Taglines",
          listLines(
            system.messaging.alternateTaglines
          ),
          "",
          `One-line Pitch: ${system.messaging.oneLinePitch}`,
          `Short Description: ${system.messaging.shortDescription}`,
          `Elevator Pitch: ${system.messaging.elevatorPitch}`,
          "",
          "Key Messages",
          listLines(
            system.messaging.keyMessages
          ),
          "",
          "VOICE SYSTEM",
          "----------------------------------------",
          `Voice: ${system.voice.definition}`,
          "",
          "Tone Principles",
          listLines(
            system.voice.tonePrinciples
          ),
          "",
          "We Sound Like",
          listLines(
            system.voice.soundsLike
          ),
          "",
          "We Never Sound Like",
          listLines(
            system.voice.neverSoundsLike
          ),
          "",
          `Sample Copy: ${system.voice.sampleCopy}`,
          "",
          "VISUAL IDENTITY DIRECTION",
          "----------------------------------------",
          `Visual Personality: ${system.identityDirection.visualPersonality}`,
          "",
          "Colour Direction",
          listLines(
            system.identityDirection.colorDirection
          ),
          "",
          `Typography Direction: ${system.identityDirection.typographyDirection}`,
          `Graphic Language: ${system.identityDirection.graphicLanguage}`,
          `Logo Direction: ${system.identityDirection.logoDirection}`,
          "",
          "LAUNCH SYSTEM",
          "----------------------------------------",
          `Homepage Hero: ${system.launchSystem.homepageHero}`,
          `Homepage Subhead: ${system.launchSystem.homepageSubhead}`,
          `Primary CTA: ${system.launchSystem.primaryCTA}`,
          `Social Bio: ${system.launchSystem.socialBio}`,
          `Launch Announcement: ${system.launchSystem.launchAnnouncement}`,
          "",
          "DECISION TRACE",
          "----------------------------------------",
          `Founder Decision: ${decisionLabel}`,
          `Court Influence: ${system.decisionTrace.courtInfluence}`,
          "",
          "Preserved Elements",
          listLines(
            system.decisionTrace.preservedElements
          ),
          "",
          "Revisions Applied",
          system.decisionTrace.revisionsApplied.length
            ? listLines(
                system.decisionTrace.revisionsApplied
              )
            : "- None by founder choice",
          "",
          "Known Risks",
          listLines(
            system.decisionTrace.knownRisks
          ),
          "",
          "Generated with BRAND//COURT",
          "Strategy is a working system, not a substitute for future customer validation.",
        ].join("\n");
      };


    const copyBrandSystem =
      async () => {

        const text =
          buildExportText();

        try {

          await navigator.clipboard.writeText(
            text
          );

          setExportStatus(
            "COPIED ✓"
          );

        } catch {

          const textarea =
            document.createElement(
              "textarea"
            );

          textarea.value =
            text;

          textarea.style.position =
            "fixed";

          textarea.style.opacity =
            "0";

          document.body.appendChild(
            textarea
          );

          textarea.select();

          document.execCommand(
            "copy"
          );

          document.body.removeChild(
            textarea
          );

          setExportStatus(
            "COPIED ✓"
          );
        }


        setTimeout(() => {
          setExportStatus("");
        }, 1800);
      };


    const downloadBrandSystem =
      () => {

        const text =
          buildExportText();

        const safeName =
          finalSystem
            .naming
            .primaryName
            .replace(
              /[^a-z0-9]+/gi,
              "-"
            )
            .replace(
              /^-|-$/g,
              ""
            )
            .toLowerCase() ||
          "brand-system";

        const blob =
          new Blob(
            [text],
            {
              type:
                "text/plain;charset=utf-8",
            }
          );

        const url =
          URL.createObjectURL(
            blob
          );

        const anchor =
          document.createElement(
            "a"
          );

        anchor.href =
          url;

        anchor.download =
          `${safeName}-brand-system.txt`;

        document.body.appendChild(
          anchor
        );

        anchor.click();

        document.body.removeChild(
          anchor
        );

        URL.revokeObjectURL(
          url
        );

        setExportStatus(
          "DOWNLOADED ✓"
        );

        setTimeout(() => {
          setExportStatus("");
        }, 1800);
      };


    const printBrandSystem =
      () => {

        window.print();
      };


    const resetCase =
      () => {
        setScreen(
          "home"
        );

        setIdea(
          ""
        );

        setAnswers({
          audience: "",
          alternative: "",
          difference: "",
        });

        setEvidenceData(
          null
        );

        setBrandDna(
          null
        );

        setDirectionsData(
          null
        );

        setSelectedDirection(
          null
        );

        setTrialData(
          null
        );

        setFounderDecision(
          null
        );

        setFinalSystem(
          null
        );

        setExportStatus(
          ""
        );
      };


    return (
      <div className="app final-app">

        <TopBar
          section="FINAL SYSTEM LOCKED"

          audioEnabled={
            audioEnabled
          }

          toggleAudio={
            toggleAudio
          }
        />


        <main className="page-shell final-shell">

          <button
            className="back-button"

            onClick={() =>
              setScreen(
                "decision"
              )
            }
          >
            ← RETURN TO DECISION
          </button>


          <div className="page-code">
            BC://CASE/001/FINAL
          </div>


          <div className="system-kicker">
            STAGE 07 // DELIVER
          </div>


          <h2 className="page-title final-page-title">

            <TypeText
              text="STRATEGY SURVIVED. NOW MAKE IT RECOGNISABLE."

              speed={52}

              sound={true}

              audioEnabled={
                audioEnabled
              }
            />

          </h2>


          <p className="page-description">
            Every layer below traces back to
            the evidence, Brand DNA, selected
            vector, court findings and founder
            decision.
          </p>


          {finalSystem.provisional && (

            <div className="system-warning">

              <strong>
                PROVISIONAL FINAL SYSTEM
              </strong>

              <p>
                The AI service was temporarily
                unavailable. Brand Court used
                its structured final-system
                fallback so the case could
                still be completed.
              </p>

            </div>

          )}


          <section className="final-status-strip">

            <div>
              <span>
                CASE STATUS
              </span>

              <strong>
                COMPLETE
              </strong>
            </div>


            <div>
              <span>
                SELECTED VECTOR
              </span>

              <strong>
                {
                  direction.name
                }
              </strong>
            </div>


            <div>
              <span>
                FOUNDER DECISION
              </span>

              <strong>
                {
                  decisionLabel
                }
              </strong>
            </div>


            <div>
              <span>
                SYSTEM STATE
              </span>

              <strong>
                LOCKED
              </strong>
            </div>

          </section>


          <section className="final-export-bar">

            <div className="final-export-copy">

              <span>
                CASE OUTPUT // READY
              </span>

              <p>
                Copy, download or print the complete
                brand system for your submission or demo.
              </p>

            </div>


            <div className="final-export-actions">

              <button
                type="button"
                onClick={
                  copyBrandSystem
                }
              >
                {
                  exportStatus ===
                  "COPIED ✓"
                    ? exportStatus
                    : "COPY FULL SYSTEM"
                }
              </button>


              <button
                type="button"
                onClick={
                  downloadBrandSystem
                }
              >
                {
                  exportStatus ===
                  "DOWNLOADED ✓"
                    ? exportStatus
                    : "DOWNLOAD .TXT"
                }
              </button>


              <button
                type="button"
                onClick={
                  printBrandSystem
                }
              >
                PRINT / SAVE PDF
              </button>

            </div>

          </section>


          <section className="final-name-card">

            <span className="final-module-code">
              OUTPUT_01 // NAMING
            </span>


            <p className="final-eyebrow">
              RECOMMENDED BRAND NAME
            </p>


            <h3>
              {
                finalSystem
                  .naming
                  .primaryName
              }
            </h3>


            <p className="final-name-rationale">
              {
                finalSystem
                  .naming
                  .rationale
              }
            </p>


            <div className="alternate-name-row">

              {finalSystem
                .naming
                .alternates
                .map(
                  (
                    name,
                    index
                  ) => (
                    <span
                      key={
                        index
                      }
                    >
                      ALT_
                      {String(
                        index + 1
                      ).padStart(
                        2,
                        "0"
                      )}
                      {" // "}
                      {name}
                    </span>
                  )
                )}

            </div>

          </section>


          <section className="final-section">

            <div className="final-section-header">

              <div>
                <span>
                  OUTPUT_02
                </span>

                <h3>
                  FINAL BRAND CORE
                </h3>
              </div>

              <span>
                STRATEGY LOCKED
              </span>

            </div>


            <div className="final-core-grid">

              <article className="final-core-card final-core-wide">

                <span>
                  POSITIONING
                </span>

                <p>
                  {
                    finalSystem
                      .finalCore
                      .positioning
                  }
                </p>

              </article>


              <article className="final-core-card">

                <span>
                  PURPOSE
                </span>

                <p>
                  {
                    finalSystem
                      .finalCore
                      .purpose
                  }
                </p>

              </article>


              <article className="final-core-card">

                <span>
                  AUDIENCE
                </span>

                <p>
                  {
                    finalSystem
                      .finalCore
                      .audience
                  }
                </p>

              </article>


              <article className="final-core-card final-core-wide accent">

                <span>
                  CORE PROMISE
                </span>

                <p>
                  {
                    finalSystem
                      .finalCore
                      .corePromise
                  }
                </p>

              </article>

            </div>

          </section>


          <section className="final-section">

            <div className="final-section-header">

              <div>
                <span>
                  OUTPUT_03
                </span>

                <h3>
                  MESSAGING SYSTEM
                </h3>
              </div>

              <span>
                COMMUNICATION LAYER
              </span>

            </div>


            <div className="primary-tagline-card">

              <span>
                PRIMARY TAGLINE
              </span>

              <h4>
                “
                {
                  finalSystem
                    .messaging
                    .primaryTagline
                }
                ”
              </h4>

            </div>


            <div className="alternate-tagline-grid">

              {finalSystem
                .messaging
                .alternateTaglines
                .map(
                  (
                    tagline,
                    index
                  ) => (
                    <article
                      key={
                        index
                      }
                    >
                      <span>
                        ALT_
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </span>

                      <p>
                        {
                          tagline
                        }
                      </p>
                    </article>
                  )
                )}

            </div>


            <div className="message-system-grid">

              <article className="final-data-card">

                <span>
                  ONE-LINE PITCH
                </span>

                <p>
                  {
                    finalSystem
                      .messaging
                      .oneLinePitch
                  }
                </p>

              </article>


              <article className="final-data-card">

                <span>
                  SHORT DESCRIPTION
                </span>

                <p>
                  {
                    finalSystem
                      .messaging
                      .shortDescription
                  }
                </p>

              </article>


              <article className="final-data-card message-wide">

                <span>
                  ELEVATOR PITCH
                </span>

                <p>
                  {
                    finalSystem
                      .messaging
                      .elevatorPitch
                  }
                </p>

              </article>

            </div>


            <div className="final-list-panel">

              <span>
                KEY MESSAGES
              </span>


              {finalSystem
                .messaging
                .keyMessages
                .map(
                  (
                    message,
                    index
                  ) => (
                    <div
                      className="final-list-row"

                      key={
                        index
                      }
                    >
                      <b>
                        MSG_
                        {String(
                          index + 1
                        ).padStart(
                          2,
                          "0"
                        )}
                      </b>

                      <p>
                        {
                          message
                        }
                      </p>
                    </div>
                  )
                )}

            </div>

          </section>


          <section className="final-section">

            <div className="final-section-header">

              <div>
                <span>
                  OUTPUT_04
                </span>

                <h3>
                  VOICE SYSTEM
                </h3>
              </div>

              <span>
                VERBAL IDENTITY
              </span>

            </div>


            <div className="voice-definition-card">

              <span>
                BRAND VOICE
              </span>

              <p>
                {
                  finalSystem
                    .voice
                    .definition
                }
              </p>

            </div>


            <div className="voice-grid">

              <article className="final-list-panel">

                <span>
                  TONE PRINCIPLES
                </span>


                {finalSystem
                  .voice
                  .tonePrinciples
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="final-list-row"

                        key={
                          index
                        }
                      >
                        <b>
                          +
                        </b>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )}

              </article>


              <article className="final-list-panel positive-panel">

                <span>
                  WE SOUND LIKE
                </span>


                {finalSystem
                  .voice
                  .soundsLike
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="final-list-row"

                        key={
                          index
                        }
                      >
                        <b>
                          +
                        </b>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )}

              </article>


              <article className="final-list-panel negative-panel">

                <span>
                  WE NEVER SOUND LIKE
                </span>


                {finalSystem
                  .voice
                  .neverSoundsLike
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="final-list-row"

                        key={
                          index
                        }
                      >
                        <b>
                          ×
                        </b>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )}

              </article>

            </div>


            <div className="sample-copy-card">

              <span>
                SAMPLE BRAND COPY
              </span>

              <p>
                {
                  finalSystem
                    .voice
                    .sampleCopy
                }
              </p>

            </div>

          </section>


          <section className="final-section">

            <div className="final-section-header">

              <div>
                <span>
                  OUTPUT_05
                </span>

                <h3>
                  VISUAL IDENTITY DIRECTION
                </h3>
              </div>

              <span>
                CREATIVE SYSTEM
              </span>

            </div>


            <div className="identity-grid">

              <article className="final-data-card identity-wide">

                <span>
                  VISUAL PERSONALITY
                </span>

                <p>
                  {
                    finalSystem
                      .identityDirection
                      .visualPersonality
                  }
                </p>

              </article>


              <article className="final-list-panel">

                <span>
                  COLOUR DIRECTION
                </span>


                {finalSystem
                  .identityDirection
                  .colorDirection
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <div
                        className="final-list-row"

                        key={
                          index
                        }
                      >
                        <b>
                          C_
                          {String(
                            index + 1
                          ).padStart(
                            2,
                            "0"
                          )}
                        </b>

                        <p>
                          {
                            item
                          }
                        </p>
                      </div>
                    )
                  )}

              </article>


              <article className="final-data-card">

                <span>
                  TYPOGRAPHY
                </span>

                <p>
                  {
                    finalSystem
                      .identityDirection
                      .typographyDirection
                  }
                </p>

              </article>


              <article className="final-data-card">

                <span>
                  GRAPHIC LANGUAGE
                </span>

                <p>
                  {
                    finalSystem
                      .identityDirection
                      .graphicLanguage
                  }
                </p>

              </article>


              <article className="final-data-card identity-wide accent">

                <span>
                  LOGO DIRECTION
                </span>

                <p>
                  {
                    finalSystem
                      .identityDirection
                      .logoDirection
                  }
                </p>

              </article>

            </div>

          </section>


          <section className="final-section">

            <div className="final-section-header">

              <div>
                <span>
                  OUTPUT_06
                </span>

                <h3>
                  LAUNCH SYSTEM
                </h3>
              </div>

              <span>
                PUBLIC-FACING COPY
              </span>

            </div>


            <div className="launch-preview">

              <span className="launch-preview-code">
                HOMEPAGE_PREVIEW
              </span>


              <h4>
                {
                  finalSystem
                    .launchSystem
                    .homepageHero
                }
              </h4>


              <p>
                {
                  finalSystem
                    .launchSystem
                    .homepageSubhead
                }
              </p>


              <button
                type="button"
              >
                {
                  finalSystem
                    .launchSystem
                    .primaryCTA
                }
                {" "}→
              </button>

            </div>


            <div className="launch-grid">

              <article className="final-data-card">

                <span>
                  SOCIAL BIO
                </span>

                <p>
                  {
                    finalSystem
                      .launchSystem
                      .socialBio
                  }
                </p>

              </article>


              <article className="final-data-card">

                <span>
                  LAUNCH ANNOUNCEMENT
                </span>

                <p>
                  {
                    finalSystem
                      .launchSystem
                      .launchAnnouncement
                  }
                </p>

              </article>

            </div>

          </section>


          <section className="final-section trace-section">

            <div className="final-section-header">

              <div>
                <span>
                  OUTPUT_07
                </span>

                <h3>
                  DECISION TRACE
                </h3>
              </div>

              <span>
                AUDITABLE STRATEGY
              </span>

            </div>


            <article className="court-influence-card">

              <span>
                FOUNDER DECISION EFFECT
              </span>

              <p>
                {
                  finalSystem
                    .decisionTrace
                    .courtInfluence
                }
              </p>

            </article>


            <div className="trace-grid">

              <article className="trace-card preserve-trace">

                <span>
                  PRESERVED
                </span>


                {finalSystem
                  .decisionTrace
                  .preservedElements
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        <b>
                          +
                        </b>
                        {" "}
                        {item}
                      </p>
                    )
                  )}

              </article>


              <article className="trace-card revision-trace">

                <span>
                  REVISIONS APPLIED
                </span>


                {finalSystem
                  .decisionTrace
                  .revisionsApplied
                  .length >
                0 ? (

                  finalSystem
                    .decisionTrace
                    .revisionsApplied
                    .map(
                      (
                        item,
                        index
                      ) => (
                        <p
                          key={
                            index
                          }
                        >
                          <b>
                            ↻
                          </b>
                          {" "}
                          {item}
                        </p>
                      )
                    )

                ) : (

                  <p>
                    <b>
                      —
                    </b>
                    {" "}
                    No court revisions were
                    applied by founder choice.
                  </p>

                )}

              </article>


              <article className="trace-card risk-trace">

                <span>
                  KNOWN RISKS
                </span>


                {finalSystem
                  .decisionTrace
                  .knownRisks
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <p
                        key={
                          index
                        }
                      >
                        <b>
                          !
                        </b>
                        {" "}
                        {item}
                      </p>
                    )
                  )}

              </article>

            </div>

          </section>


          <section className="final-complete">

            <div className="final-complete-symbol">
              ◈
            </div>


            <span>
              BRAND SYSTEM // COMPLETE
            </span>


            <h3>
              FROM ROUGH IDEA
              <br />
              TO DEFENSIBLE BRAND SYSTEM.
            </h3>


            <p>
              The strategy remains a working
              system, not a substitute for
              future customer validation.
            </p>


            <button
              className="primary-button"

              onClick={
                resetCase
              }
            >
              OPEN NEW CASE →
            </button>

          </section>


          <div className="bottom-system-bar final-bottom-bar">

            <span>
              DISCOVER // COMPLETE
            </span>

            <span>
              VERIFY // COMPLETE
            </span>

            <span>
              DEFINE // COMPLETE
            </span>

            <span>
              POSITION // COMPLETE
            </span>

            <span>
              CHALLENGE // COMPLETE
            </span>

            <span>
              DECIDE // COMPLETE
            </span>

            <span>
              DELIVER // COMPLETE
            </span>

          </div>

        </main>

      </div>
    );
  }


  return null;
}


export default App;