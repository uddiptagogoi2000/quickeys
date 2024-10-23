import { RiRestartLine } from '@remixicon/react';
import { useEffect, useReducer } from 'react';

let paragraph =
  'This is a paragraph that you need to type as fast as you can. The time starts as soon as you start typing. Good luck! Please note, this application is in its pre-alpha stage, and new features are coming soon. Stay tuned for updates!';

type TypingState = {
  boardState: 'focused' | 'blurred' | 'finished';
  paragraph: string;
  words: Word[];
  activeWordIndex: number;
  activeLetterIndex: number;
  config: Readonly<TypingConfig>;
};

type TypingAction =
  | {
      type:
        | 'FOCUS'
        | 'BLUR'
        | 'FINISH'
        | 'START'
        | 'NEXT'
        | 'REPEAT'
        | 'RESTART';
    }
  | TypingActionKeyDown;

type TypingActionKeyDown = {
  type: 'KEY_DOWN';
  payload: string;
};

function getLastTypedFalseLetterIndex(state: TypingState): number {
  const { activeWordIndex } = state;
  const previousWord = state.words[activeWordIndex - 1];
  const lastTypedIdx = previousWord.letters.findIndex(
    (letter) => letter.typed === false
  );

  return lastTypedIdx === -1 ? previousWord.originalWordLength : lastTypedIdx;
}

function onBackSpaceAtIndexZero(state: TypingState): TypingState {
  const { activeWordIndex } = state;
  const lastTypedFalseLetterAtPreviousWord =
    getLastTypedFalseLetterIndex(state);

  if (state.words[activeWordIndex].extra.length === 0) {
    return {
      ...state,
      activeWordIndex: activeWordIndex - 1,
      activeLetterIndex: lastTypedFalseLetterAtPreviousWord,
      words: state.words.map((word, wordIdx) => {
        if (wordIdx === activeWordIndex) {
          return {
            ...word,
            letters: word.letters.map((letter, letterIdx) => {
              if (letterIdx === 0) {
                return {
                  ...letter,
                  active: false,
                };
              }
              return letter;
            }),
          };
        }

        if (wordIdx === activeWordIndex - 1) {
          if (
            lastTypedFalseLetterAtPreviousWord <
            state.words[activeWordIndex - 1].originalWordLength
          ) {
            return {
              ...word,
              letters: word.letters.map((letter, letterIdx) => {
                if (letterIdx === lastTypedFalseLetterAtPreviousWord) {
                  return {
                    ...letter,
                    active: true,
                  };
                }

                return letter;
              }),
            };
          }
        }

        return word;
      }),
    };
  }

  return state;
}

function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (state.boardState) {
    case 'focused':
      switch (action.type) {
        case 'RESTART': {
          console.log(state.paragraph);
          // return getInitialState(state.paragraph, state.config);
          return {
            ...state,
            activeLetterIndex: 0,
            activeWordIndex: 0,
            boardState: 'focused',
            words: makeWords(state.paragraph),
          };
        }
        case 'KEY_DOWN': {
          const { activeWordIndex, activeLetterIndex } = state;
          // const currentWord = state.words[activeWordIndex];
          // const currentLetter = currentWord.letters[activeLetterIndex];
          const typedKey = action.payload;
          let validKey = typedKey.match(
            /^[a-zA-Z0-9 !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]$/
          )
            ? typedKey
            : '';

          switch (typedKey) {
            case 'Backspace': {
              if (
                (activeLetterIndex === 0 && activeWordIndex === 0) ||
                state.config.mode === 'max_confidance'
              ) {
                return state;
              } else if (activeLetterIndex === 0) {
                switch (state.config.mode) {
                  case 'default': {
                    // default: previous word is not correct then backspace is allowed
                    if (
                      activeWordIndex !== 0 &&
                      !state.words[activeWordIndex - 1].correct
                    ) {
                      return onBackSpaceAtIndexZero(state);
                    }
                    return state;
                  }

                  case 'freedom': {
                    // Word
                    // freedom mode: allowed to go to previous words once typed - correct or incorrect
                    // trying to go back to previous word, this time allowed
                    // no extra letters are there in the word
                    return onBackSpaceAtIndexZero(state);
                  }

                  case 'confidance': {
                    break;
                  }

                  default:
                    return state;
                }
              } else {
                // Letter

                if (state.words[activeWordIndex].extra.length > 0) {
                  return {
                    ...state,
                    words: state.words.map((word, wordIdx) => {
                      if (wordIdx === activeWordIndex) {
                        return {
                          ...word,
                          extra: word.extra.filter(
                            (_, letterIdx, letters) =>
                              letterIdx !== letters.length - 1
                          ),
                        };
                      }

                      return word;
                    }),
                  };
                }

                return {
                  ...state,
                  activeLetterIndex: activeLetterIndex - 1,
                  words: state.words.map((word, wordIdx) => {
                    if (wordIdx === activeWordIndex) {
                      return {
                        ...word,
                        letters: word.letters.map((letter, letterIdx) => {
                          if (letterIdx === activeLetterIndex) {
                            return {
                              ...letter,
                              active: false,
                            };
                          }

                          // activate the previous word
                          if (letterIdx === activeLetterIndex - 1) {
                            return {
                              ...letter,
                              active: true,
                              typed: false,
                              correct: false,
                            };
                          }

                          return letter;
                        }),
                      };
                    }

                    return word;
                  }),
                };
              }

              // strict mode: cannot go to previous word once typed - correct or incorrect
              // trying to go back to previous word but not allowed
              // if (activeLetterIndex === 0) {
              //   return state;
              // }
              return state;
            }

            case validKey: {
              // check for space
              if (validKey === ' ') {
                // if it is the last word then we need to end the typing
                if (activeWordIndex === state.words.length - 1) {
                  return {
                    ...state,
                    boardState: 'finished',
                    activeLetterIndex: 0,
                    activeWordIndex: activeWordIndex + 1,
                    words: state.words.map((word, wordIdx) => {
                      if (wordIdx === activeWordIndex) {
                        return {
                          ...word,
                          active: false,
                          correct: false,
                          typed: true,
                          letters: word.letters.map((letter, letterIdx) => {
                            if (letterIdx === activeLetterIndex) {
                              return {
                                ...letter,
                                active: false,
                                correct: false,
                                typed: false,
                              };
                            }
                            return letter;
                          }),
                        };
                      }
                      return word;
                    }),
                  };
                }

                return {
                  ...state,
                  activeWordIndex: activeWordIndex + 1,
                  activeLetterIndex: 0,
                  words: state.words.map((word, wordIdx) => {
                    if (wordIdx === activeWordIndex) {
                      const isCorrectWord = word.letters.every(
                        (letter) =>
                          letter.correct === true && word.extra.length === 0
                      );
                      if (isCorrectWord) {
                        return {
                          ...word,
                          typed: true,
                          correct: true,
                          active: false,
                        };
                      }

                      return {
                        ...word,
                        typed: true,
                        active: false,
                        letters: word.letters.map((letter, letterIdx) => {
                          if (letterIdx === activeLetterIndex) {
                            return {
                              ...letter,
                              active: false,
                            };
                          }
                          return letter;
                        }),
                      };
                    }

                    // activating the first index of the next word
                    if (wordIdx === activeWordIndex + 1) {
                      return {
                        ...word,
                        active: true,
                        letters: word.letters.map((letter, letterIdx) => {
                          if (letterIdx === 0) {
                            return {
                              ...letter,
                              active: true,
                            };
                          }
                          return letter;
                        }),
                      };
                    }

                    return word;
                  }),
                };
              }

              // extra:
              // user has typed the word, next waiting for space key but user typed wrong valid key (not a space)
              // basically typing extra letters
              if (
                state.words[activeWordIndex].originalWordLength ===
                activeLetterIndex
              ) {
                if (state.words[activeWordIndex].extra.length === 19) {
                  return state;
                }

                return {
                  ...state,
                  words: state.words.map((word, wordIdx) => {
                    if (wordIdx === activeWordIndex) {
                      return {
                        ...word,
                        extra: [...word.extra, validKey],
                      };
                    }
                    return word;
                  }),
                };
              }

              const lastLetterIdx =
                state.words[activeWordIndex].letters.length - 1;

              const isCorrectLastWordTillSecondLastIndex = state.words[
                state.words.length - 1
              ].letters
                .filter(
                  (_, letterIdx, letters) => letterIdx !== letters.length - 1
                )
                .every((letter) => letter.correct);

              if (
                activeWordIndex === state.words.length - 1 &&
                activeLetterIndex ===
                  state.words[activeWordIndex].letters.length - 1 &&
                typedKey ===
                  state.words[activeWordIndex].letters[lastLetterIdx].letter &&
                isCorrectLastWordTillSecondLastIndex
              ) {
                return {
                  ...state,
                  activeLetterIndex: activeLetterIndex + 1,
                  activeWordIndex: activeWordIndex + 1,
                  boardState: 'finished',
                  words: state.words.map((word, wordIdx) => {
                    if (wordIdx === activeWordIndex) {
                      return {
                        ...word,
                        active: false,
                        correct: true,
                        typed: true,
                        letters: word.letters.map((letter, letterIdx) => {
                          if (letterIdx === activeLetterIndex) {
                            return {
                              ...letter,
                              active: false,
                              correct: true,
                              typed: true,
                            };
                          }
                          return letter;
                        }),
                      };
                    }
                    return word;
                  }),
                };
              }

              // other valid keys expect space key
              return {
                ...state,
                activeLetterIndex: activeLetterIndex + 1,
                words: state.words.map((word, wordIdx) => {
                  if (wordIdx === activeWordIndex) {
                    return {
                      ...word,
                      letters: word.letters.map((letter, letterIdx) => {
                        if (letterIdx === activeLetterIndex) {
                          if (typedKey === letter.letter) {
                            return {
                              ...letter,
                              typed: true,
                              correct: true,
                              active: false,
                            };
                          } else {
                            return {
                              ...letter,
                              typed: true,
                              correct: false,
                              active: false,
                            };
                          }
                        }

                        // activate next letter
                        if (letterIdx === activeLetterIndex + 1) {
                          return {
                            ...letter,
                            active: true,
                          };
                        }

                        return letter;
                      }),
                    };
                  } else {
                    return word;
                  }
                }),
              };
            }

            default: {
              return state;
            }
          }
        }
        case 'BLUR':
          return { ...state, boardState: 'blurred' };
        case 'FINISH':
          return { ...state, boardState: 'finished' };
        default:
          return state;
      }
    case 'blurred':
      switch (action.type) {
        case 'FOCUS':
          return { ...state, boardState: 'focused' };
        case 'FINISH':
          return { ...state, boardState: 'finished' };
        default:
          return state;
      }
    case 'finished':
      switch (action.type) {
        case 'REPEAT':
          return { ...state, boardState: 'focused' };
        case 'NEXT':
          return { ...state, boardState: 'focused' };
        case 'RESTART': {
          return {
            ...state,
            activeLetterIndex: 0,
            activeWordIndex: 0,
            boardState: 'focused',
            words: makeWords(state.paragraph),
          };
        }
        default:
          return state;
      }
  }
}

function makeWords(paragraph: string): Word[] {
  return paragraph.split(' ').map((word, wordIdx) => {
    const letters = word.split('').map((letter, letterIdx) => ({
      letter,
      correct: false,
      active: wordIdx === 0 && letterIdx === 0,
      typed: false,
    }));

    return {
      letters,
      extra: [],
      correct: false,
      active: wordIdx === 0,
      typed: false,
      originalWordLength: letters.length,
    };
  });
}

type TypingConfig = {
  mode: 'freedom' | 'default' | 'confidance' | 'max_confidance'; // default: fix the last incorrect word, freedom: any word, confidance: no word, max_confidance: no backspace at all
  stopOnERror: 'off' | 'word' | 'letter';
  difficulty: 'normal' | 'expart' | 'master';
  strictSpace: boolean;
};

const useTyping = (
  paragraph: string,
  config: Readonly<TypingConfig> = {
    difficulty: 'normal',
    mode: 'default',
    stopOnERror: 'off',
    strictSpace: false,
  }
) => {
  const initialState: TypingState = {
    boardState: 'focused',
    words: makeWords(paragraph),
    activeWordIndex: 0,
    activeLetterIndex: 0,
    config,
    paragraph,
  };
  const [state, dispatch] = useReducer(typingReducer, initialState);

  console.log(state);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      dispatch({ type: 'KEY_DOWN', payload: e.key });
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  function handleFocus() {
    dispatch({ type: 'FOCUS' });
  }

  function handleBlur() {
    dispatch({ type: 'BLUR' });
  }

  function handleFinish() {
    dispatch({ type: 'FINISH' });
  }

  function handleStart() {
    dispatch({ type: 'START' });
  }

  function handleNext() {
    dispatch({ type: 'NEXT' });
  }

  function handleRestart() {
    dispatch({ type: 'RESTART' });
  }

  return {
    state,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onFinish: handleFinish,
    onStart: handleStart,
    onNext: handleNext,
    onRestart: handleRestart,
  };
};

type Word = {
  letters: {
    letter: string;
    correct: boolean;
    active: boolean;
    typed: boolean;
  }[];
  extra: string[];
  correct: boolean;
  active: boolean;
  typed: boolean;
  originalWordLength: number;
};

// let words: Word[] = [
//   {
//     letters: [
//       { letter: 'T', correct: true, active: false, typed: true },
//       { letter: 'h', correct: true, active: false, typed: true },
//       { letter: 'i', correct: false, active: false, typed: true },
//       { letter: 's', correct: true, active: false, typed: true },
//     ],
//     extra: ['e', 'x', 't', 'r', 'a'],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 4,
//   },
//   {
//     letters: [
//       { letter: 'i', correct: true, active: true, typed: false },
//       { letter: 's', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: true,
//     typed: false,
//     originalWordLength: 2,
//   },
//   {
//     letters: [{ letter: 'a', correct: true, active: false, typed: false }],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 1,
//   },
//   {
//     letters: [
//       { letter: 'p', correct: true, active: false, typed: false },
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 'r', correct: true, active: false, typed: false },
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 'g', correct: true, active: false, typed: false },
//       { letter: 'r', correct: true, active: false, typed: false },
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 'p', correct: true, active: false, typed: false },
//       { letter: 'h', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 9,
//   },
//   {
//     letters: [
//       { letter: 't', correct: true, active: false, typed: false },
//       { letter: 'h', correct: true, active: false, typed: false },
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 't', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 4,
//   },
//   {
//     letters: [
//       { letter: 'y', correct: true, active: false, typed: false },
//       { letter: 'o', correct: true, active: false, typed: false },
//       { letter: 'u', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 3,
//   },
//   {
//     letters: [
//       { letter: 'n', correct: true, active: false, typed: false },
//       { letter: 'e', correct: true, active: false, typed: false },
//       { letter: 'e', correct: true, active: false, typed: false },
//       { letter: 'd', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 4,
//   },
//   {
//     letters: [
//       { letter: 't', correct: true, active: false, typed: false },
//       { letter: 'o', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 2,
//   },
//   {
//     letters: [
//       { letter: 't', correct: true, active: false, typed: false },
//       { letter: 'y', correct: true, active: false, typed: false },
//       { letter: 'p', correct: true, active: false, typed: false },
//       { letter: 'e', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 4,
//   },
//   {
//     letters: [
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 's', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 2,
//   },
//   {
//     letters: [
//       { letter: 'f', correct: true, active: false, typed: false },
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 's', correct: true, active: false, typed: false },
//       { letter: 't', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 4,
//   },
//   {
//     letters: [
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 's', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 2,
//   },
//   {
//     letters: [
//       { letter: 'y', correct: true, active: false, typed: false },
//       { letter: 'o', correct: true, active: false, typed: false },
//       { letter: 'u', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 3,
//   },
//   {
//     letters: [
//       { letter: 'c', correct: true, active: false, typed: false },
//       { letter: 'a', correct: true, active: false, typed: false },
//       { letter: 'n', correct: true, active: false, typed: false },
//     ],
//     extra: [],
//     correct: true,
//     active: false,
//     typed: false,
//     originalWordLength: 3,
//   },
// ];

const TypingBoard = () => {
  const { state, onRestart } = useTyping(paragraph, {
    difficulty: 'normal',
    mode: 'freedom',
    stopOnERror: 'off',
    strictSpace: false,
  });

  // find caret position (x, y) = (wordIdx, letterIndex)

  return (
    <>
      <div
        className='text-2xl leading-relaxed h-40'
        style={{
          wordSpacing: '.2em',
        }}
      >
        {state.words.map((word, index) => {
          let isCaretAtLast =
            state.activeWordIndex === index &&
            state.activeLetterIndex ===
              state.words[state.activeWordIndex].originalWordLength;

          return (
            <span key={index} className='tracking-widest font-light'>
              {word.letters.map((letter, index) => (
                <span
                  key={index}
                  style={{
                    color: letter.typed
                      ? letter.correct
                        ? 'var(--text-color)'
                        : 'var(--incorrect-letter-color)'
                      : 'var(--sub-color)',
                    // textDecoration: letter.active ? 'underline' : '',
                    position: 'relative',
                  }}
                  className={`relative inline-block ${
                    letter.active ? 'active' : ''
                  }`}
                >
                  {letter.letter}
                </span>
              ))}
              {word.extra.length > 0 && (
                <span
                  style={{
                    color: 'var(--incorrect-letter-color)',
                  }}
                >
                  {word.extra.join('')}
                </span>
              )}
              {isCaretAtLast ? (
                <span className='active'>
                  <span className='invisible'>!</span>
                </span>
              ) : (
                <span className='invisible'>!</span>
              )}
            </span>
          );
        })}
      </div>
      <code className='text-base'>Dev only</code>
      <p className='text-sm'>{`Current state: ${state.boardState}`}</p>
      {/* <button onClick={onStart}>Start</button>
      <button onClick={onFocus}>Focus</button>
      <button onClick={onBlur}>Blur</button>
      <button onClick={onFinish}>Finish</button>
      <button onClick={onNext}>Next test</button> */}
      <div className='flex justify-center'>
        <button
          onClick={() => {
            onRestart(); // Your restart logic
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement && typeof activeElement.blur === 'function') {
              activeElement.blur(); // Remove focus after click
            }
          }}
        >
          <RiRestartLine size={40} />
        </button>
      </div>
    </>
  );
};

export default TypingBoard;
