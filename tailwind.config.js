const DEFAULT_FONT_FAMILIES = [
  'system-ui',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'Roboto',
  '"Helvetica Neue"',
  'Arial',
  '"Noto Sans"',
  'sans-serif',
  '"Apple Color Emoji"',
  '"Segoe UI Emoji"',
  '"Segoe UI Symbol"',
  '"Noto Color Emoji"'
];

const FONTS_FAMILIES = {
  Inter: ["'Inter'", ...DEFAULT_FONT_FAMILIES],
  Rubik: ["'Rubik'", "'Inter'", ...DEFAULT_FONT_FAMILIES]
};

module.exports = {
  content: ['./public/**/*.{html,js,mjs}', './src/**/*.{js,jsx,ts,tsx}'],
  prefix: '',
  important: false,
  separator: ':',

  theme: {
    boxShadow: {
      'xs-white': '0 0 0 1px rgba(255, 255, 255, 0.05)',
      xs: '0 0 0 1px rgba(0, 0, 0, 0.05)',
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      'top-light': '0 -1px 2px 0 rgba(0, 0, 0, 0.1)',
      DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
      'inner-bottom': 'inset 0 -2px 4px 0 rgba(0, 0, 0, 0.06)',
      outline: '0 0 0 3px rgba(237, 137, 54, 0.5)',
      none: 'none',
      //
      bottom: '0px 2px 8px 0px rgba(0, 0, 0, 0.08)',
      center: '0px 0px 8px 0px #00000014',
      'content-inset': 'inset 0px 10px 8px -8px #00000014',
      drop: '0px 2px 4px 0px #00000040',
      card: '0px 2px 8px 0px #00000014'
    },

    fontFamily: {
      inter: FONTS_FAMILIES.Inter,
      rubik: FONTS_FAMILIES.Rubik
    },

    // # EXTENDING DEFAULTS:

    extend: {
      blur: {
        xs: '2px'
      },

      colors: {
        gray: {
          100: '#f7fafc',
          200: '#edf2f7',
          300: '#e2e8f0',
          350: '#d8e0e8',
          400: '#cbd5e0',
          500: '#a0aec0',
          600: '#718096',
          700: '#4a5568',
          800: '#2d3748',
          850: '#212e36',
          900: '#1a202c',
          910: '#1b262c'
        },
        red: {
          100: '#fff5f5',
          300: '#feb2b2',
          400: '#fc8181',
          500: '#f56565',
          600: '#e53e3e',
          700: '#c53030'
        },
        orange: {
          100: '#fffaf0',
          500: '#ed8936'
        },
        yellow: {
          100: '#fffff0',
          400: '#f6e05e',
          500: '#fed500',
          600: '#d69e2e',
          700: '#b7791f'
        },
        green: {
          100: '#f0fff4',
          400: '#68d391',
          500: '#48bb78',
          700: '#2f855a'
        },
        blue: {
          50: '#e8f1fd',
          100: '#ebf8ff',
          150: '#E5F2FF',
          500: '#4299e1',
          600: '#3182ce',
          650: '#007AFF',
          700: '#2b6cb0',
          750: '#4a5568'
        },
        indigo: {
          500: '#667eea',
          600: '#5a67d8'
        },

        document: '#F4F4F4',
        /** Set in :root. Use in special cases by name */
        text: '#151618',
        background: '#fbfbfb',
        lines: '#E4E4E4',
        disable: '#DDDDDD',
        //
        'grey-1': '#707070',
        'grey-2': '#AEAEB2',
        'grey-3': '#C2C2C8',
        'grey-4': '#F4F4F4',
        //
        primary: '#FF5B00',
        'primary-hover': '#E85300',
        'primary-low': '#FAEAE1',
        'primary-hover-low': '#F7E1D5',
        //
        secondary: '#1373E4',
        'secondary-hover': '#1062C2',
        'secondary-low': '#E3ECF8',
        'secondary-hover-low': '#D7E3F2',
        //
        success: '#34CC4E',
        'success-low': '#E6F5E9',
        error: '#FF3B30',
        'error-hover': '#D93229',
        'error-low': '#FAE7E6',
        'error-hover-low': '#EFD4D2',
        warning: '#FFD600',
        'warning-low': '#FAF6E1',
        //
        /** Originally 'input' */
        'input-low': '#F0F0F0',
        'marker-highlight': '#FFFF02',
        //
        // # Deprecated
        'primary-white': '#fcfaf7',
        'primary-orange': '#ed8936',
        'primary-orange-light': '#fbd38d',
        'primary-orange-dark': '#c05621',
        'primary-orange-lighter': '#fffaf0',
        'primary-orange-darker': '#7b341e'
      },

      fontSize: {
        xxxs: ['0.625rem', { lineHeight: '0.75rem' }],
        xxs: '0.6875rem',
        '2xs': '0.8125rem',
        ulg: '1.0625rem',
        '2xl-plus': ['2rem', { lineHeight: '3rem' }],
        '4xl-plus': '2.5rem'
      },

      spacing: {
        '0.5px': '0.5px',
        13: '3.25rem',
        13.5: '3.375rem',
        15: '3.75rem',
        18: '4.5rem',
        19: '4.75rem',
        23: '5.75rem',
        25: '6.25rem',
        29: '7.25rem',
        52: '13rem',
        55: '13.75rem',
        63: '15.75rem',
        65: '16.25rem',
        70: '17.50rem',
        71: '17.75rem',
        82: '20.5rem',
        88: '22rem'
      },

      scale: {
        '1/3': '33.333333%'
      },

      opacity: {
        15: '0.15'
      },

      width: theme => ({
        ...theme('spacing'),
        modal: '22rem'
      }),

      minWidth: theme => theme('width'),

      maxWidth: (theme, { breakpoints }) => ({
        ...theme('width'),
        30: '7.5rem',
        xs: '20rem',
        sm: '24rem',
        md: '28rem',
        lg: '32rem',
        xl: '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '9/10': '90%',
        ...breakpoints(theme('screens'))
      }),

      margin: (theme, { negative }) => ({
        ...theme('spacing'),
        ...negative(theme('spacing'))
      }),

      padding: theme => ({
        ...theme('spacing'),
        '1/2': '50%',
        '1/3': '33.333333%',
        '2/3': '66.666667%',
        '1/4': '25%',
        '2/4': '50%',
        '3/4': '75%',
        '1/5': '20%',
        '2/5': '40%',
        '3/5': '60%',
        '4/5': '80%',
        '1/6': '16.666667%',
        '2/6': '33.333333%',
        '3/6': '50%',
        '4/6': '66.666667%',
        '5/6': '83.333333%',
        '1/12': '8.333333%',
        '2/12': '16.666667%',
        '3/12': '25%',
        '4/12': '33.333333%',
        '5/12': '41.666667%',
        '6/12': '50%',
        '7/12': '58.333333%',
        '8/12': '66.666667%',
        '9/12': '75%',
        '10/12': '83.333333%',
        '11/12': '91.666667%',
        full: '100%'
      }),

      inset: {
        '2px': '2px',
        '1/2': '50%',
        18: '4.5rem'
      },

      borderWidth: {
        0.5: '0.5px',
        1.5: '1.5px',
        3: '3px'
      },

      borderColor: theme => ({
        ...theme('colors'),
        DEFAULT: '#e2e8f0'
      }),

      divideColor: theme => theme('borderColor'),

      divideWidth: theme => theme('borderWidth'),

      zIndex: {
        1: 1,
        25: '25',
        45: '45',
        header: 50,
        sticky: 100,
        overlay: 400,
        'overlay-confirm': 500,
        'modal-page': 600,
        dropdown: 800,
        'modal-dialog': 1000,
        'overlay-promo': 1100
      },

      space: (theme, { negative }) => ({
        ...theme('spacing'),
        ...negative(theme('spacing'))
      }),

      gap: theme => theme('spacing'),

      borderRadius: {
        3: 3,
        5: 5,
        6: 6,
        7: 7,
        8: 8,
        10: 10,
        circle: '50%',
        inherit: 'inherit'
      },

      translate: (theme, { negative }) => ({
        ...theme('spacing'),
        ...negative(theme('spacing')),
        '-full': '-100%',
        '-1/2': '-50%',
        '1/2': '50%',
        '1/3': '33.333333%',
        '-1/3': '-33.333333%',
        full: '100%'
      }),

      transitionDuration: {
        400: '400ms',
        10000: '10000ms'
      },

      animation: {
        'toast-enter': 'toast-enter .2s ease-out',
        'toast-leave': 'toast-leave .15s ease-in forwards',
        shake: 'shake 0.2s ease-in-out 0s 2'
      },
      keyframes: {
        'toast-enter': {
          '0%': {
            opacity: '0',
            transform: 'scale(.9) translateY(132px)'
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1) translateY(0)'
          }
        },
        'toast-leave': {
          '0%': {
            opacity: '1',
            transform: 'scale(1)'
          },
          '100%': {
            opacity: '0',
            transform: 'scale(.9)'
          }
        },
        shake: {
          '0%': {
            'margin-left': '0rem'
          },
          '25%': {
            'margin-left': '0.5rem'
          },
          '75%': {
            'margin-left': '-0.5rem'
          },
          '100%': {
            'margin-left': '0rem'
          }
        }
      }
    }
  }
};
