/** Base error every connector/runtime failure derives from, tagged with the source id. */
export class ConnectorError extends Error {
  readonly connectorId: string;
  constructor(connectorId: string, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ConnectorError";
    this.connectorId = connectorId;
  }
}

/** A network/HTTP failure talking to a portal. */
export class FetchError extends ConnectorError {
  constructor(connectorId: string, message: string, options?: { cause?: unknown }) {
    super(connectorId, message, options);
    this.name = "FetchError";
  }
}

/** The portal returned an unexpected shape (bad JSON, missing fields, SoQL error). */
export class ParseError extends ConnectorError {
  constructor(connectorId: string, message: string, options?: { cause?: unknown }) {
    super(connectorId, message, options);
    this.name = "ParseError";
  }
}

/** A field mapping failed to produce a required canonical field. */
export class MappingError extends ConnectorError {
  constructor(connectorId: string, message: string, options?: { cause?: unknown }) {
    super(connectorId, message, options);
    this.name = "MappingError";
  }
}

/** A request exceeded its timeout budget. */
export class TimeoutError extends ConnectorError {
  constructor(connectorId: string, message: string, options?: { cause?: unknown }) {
    super(connectorId, message, options);
    this.name = "TimeoutError";
  }
}

/** A connector that exists but is intentionally not wired (e.g. the paid aggregator). */
export class NotEnabledError extends ConnectorError {
  constructor(connectorId: string, message: string) {
    super(connectorId, message);
    this.name = "NotEnabledError";
  }
}
