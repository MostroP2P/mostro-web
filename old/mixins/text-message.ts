const DEFAULT_MAX_LENGTH = 15
export default {
  data() {
    return {
      isMobile: false
    }
  },
  mounted() {
    // @ts-ignore
    this.checkMobile();
    // @ts-ignore
    window.addEventListener('resize', this.checkMobile);
  },
  beforeDestroy() {
    // @ts-ignore
    window.removeEventListener('resize', this.checkMobile);
  },
  methods: {
    checkMobile() {
      // @ts-ignore
      this.isMobile = window.innerWidth <= 600;
    },
    truncateMiddle(str: string, maxLength?: number) {
      if (!maxLength) maxLength = DEFAULT_MAX_LENGTH
      if (str.length <= maxLength) {
        return str;
      }

      const halfLength = Math.floor(maxLength / 2);
      const start = str.slice(0, halfLength);
      const end = str.slice(-halfLength);
      return `${start}...${end}`;
    }
  }
}