package responses

type ArrayResponse[T any] struct {
	Items []T `json:"items"`
}

func NewArrayResponse[T any](arr []T) *ArrayResponse[T] {
	return &ArrayResponse[T]{
		Items: arr,
	}
}

type ListResponse[T any] struct {
	Items   []T  `json:"items"`
	HasNext bool `json:"has_next"`
}

func NewListResponse[T any](arr []T, hasNext bool) *ListResponse[T] {
	return &ListResponse[T]{
		Items:   arr,
		HasNext: hasNext,
	}
}
