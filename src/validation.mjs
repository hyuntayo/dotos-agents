export class ApiError extends Error {
  constructor(status, message, code = "INVALID_REQUEST") { super(message); this.status = status; this.code = code }
}
