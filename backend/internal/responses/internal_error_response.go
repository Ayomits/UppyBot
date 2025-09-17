package responses

type InternalError struct {
	Message string `json:"message"`
}

func NewInternalError(err ...string) *InternalError {
	if len(err) > 0 {
		return &InternalError{
			Message: err[0],
		}
	}
	return &InternalError{
		Message: "Internal server exception",
	}
}
