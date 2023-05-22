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
    }
  }
}