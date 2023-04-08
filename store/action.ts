

export enum Action {
  Order = 'Order',
  TakeSell = 'TakeSell',
  TakeBuy = 'TakeBuy',
  PayInvoice = 'PayInvoice',
  FiatSent = 'FiatSent',
  Release = 'Release',
  Cancel = 'Cancel',

  // Custom-non official action
  InvoiceAccepted = 'InvoiceAccepted',
  SaleCompleted = 'SaleCompleted'
}