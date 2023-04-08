

export enum Action {
  Order = 'Order',
  TakeSell = 'TakeSell',
  InvoiceAccepted = 'InvoiceAccepted',
  TakeBuy = 'TakeBuy',
  PayInvoice = 'PayInvoice',
  FiatSent = 'FiatSent',
  Release = 'Release',

  // Custom-non official action
  SaleCompleted = 'SaleCompleted'
}