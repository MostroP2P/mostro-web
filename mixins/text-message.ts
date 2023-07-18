const DEFAULT_MAX_LENGTH = 15
export default {
  methods: {
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