import { defineStore } from 'pinia'
import type { Mostro } from '~/utils/mostro'
import type { MostroInfo } from '~/utils/mostro/types'

type MostrosMap = Record<string, MostroInfo>

export const useMostroStore = defineStore('mostro', {
  state: () => ({
    mostrosMap: {} as MostrosMap,
  }),
  actions: {
    nuxtClientInit() {
      const mostro = useNuxtApp().$mostro as Mostro;
      mostro.on('info-update', (mostroInfo:  MostroInfo) => {
        this.addMostroInfo(mostroInfo);
      });
    },
    getMostroInfo(pubkey: string):  MostroInfo | undefined {
      return this.mostrosMap[pubkey];
    },
    addMostroInfo(mostroInfo: MostroInfo) {
      const previousMostroInfo = this.mostrosMap[mostroInfo.mostro_pubkey];
      if (!previousMostroInfo || previousMostroInfo.created_at <= mostroInfo.created_at) {
        this.mostrosMap[mostroInfo.mostro_pubkey] = mostroInfo;
      }
    },
    removeMostroInfo(pubkey: string) {
      delete this.mostrosMap[pubkey];
    },
    listMostroKeys(): string[] {
      return Object.keys(this.mostrosMap);
    }
  }
});
