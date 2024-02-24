import * as timeagoJs from 'timeago.js'

export function useTimeago() {
  const format = (date: string | number | Date) => {
    return timeagoJs.format(date)
  }
  return { format }
}

