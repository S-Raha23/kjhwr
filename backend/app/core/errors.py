"""Domain exceptions, mapped to HTTP status codes in one place (``app.main``)."""


class DataUnavailableError(Exception):
    """Upstream data could not be fetched or no snapshot is loaded."""


class IngestValidationError(Exception):
    """Fetched data failed the snapshot validation rules."""
