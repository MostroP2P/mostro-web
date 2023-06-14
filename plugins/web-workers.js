import BcryptWorker from '~/assets/js/bcrypt.worker'

export default (_, inject) => {
  inject('worker', {
    createWorker() {
      return new BcryptWorker()
    }
  })
}