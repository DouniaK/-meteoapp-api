// Erreur "métier" portant un code HTTP : elle est transformée en réponse
// propre par le middleware errorHandler.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
module.exports = HttpError;
