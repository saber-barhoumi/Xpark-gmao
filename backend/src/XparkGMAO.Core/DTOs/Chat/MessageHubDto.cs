namespace XparkGMAO.Core.DTOs.Chat
{
    /// <summary>
    /// DTO plat envoyé via SignalR — aucune navigation EF imbriquée.
    /// </summary>
    public class MessageHubDto
    {
        public long    IdMessage      { get; set; }
        public long    ConversationId { get; set; }
        public long    ExpediteurId   { get; set; }
        public string  NomExpediteur  { get; set; } = string.Empty;
        public string  Contenu        { get; set; } = string.Empty;
        public string  TypeMessage    { get; set; } = "TEXTE";
        public bool    EstLu          { get; set; }
        public string  DateEnvoi      { get; set; } = string.Empty;
        public string? CheminFichier  { get; set; }
        public string? NomFichier     { get; set; }
        public long?   TailleFichier  { get; set; }
        public long?   ReponseAMessageId { get; set; }
        public string? AvatarUrl      { get; set; }
        public bool    Epingle        { get; set; }
    }
}
