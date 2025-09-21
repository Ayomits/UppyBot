package parsers

import "time"

type RemindParser struct{}

func NewRemindParser() *RemindParser {
	return &RemindParser{}
}

type MessageEmbed struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Timestamp   time.Time `json:"timestamp"`
}

type Message struct {
	Content string         `json:"content"`
	Embeds  []MessageEmbed `json:"embeds"`
}

type ParserInput struct {
	MonitoringId string  `json:"monitoringId"`
	ExecutorId   string  `json:"executorId"`
	Message      Message `json:"message"`
}

type ParserOutput struct {
	Success   bool      `json:"success"`
	Timestamp time.Time `json:"timestamp"`
	Type      int       `json:"type"`
}

func (r *RemindParser) ParseDsMonitoring() {}

func (r *RemindParser) ParseSdcMonitoring() {
	panic("implement me")
}

func (r *RemindParser) ParseServerMonitoring() {}
