namespace XparkGMAO.Core.DTOs.Chat
{
    public class SaveCallMessageDto
    {
        public long   ConversationId  { get; set; }
        public long   CallerId        { get; set; }
        public long   CalleeId        { get; set; }
        public string CallType        { get; set; } = "audio";
        public string Status          { get; set; } = "Missed";
        public int    DurationSeconds { get; set; } = 0;
    }
}
