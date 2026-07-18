namespace Chat.Domain.Entities;

// ── Enums ─────────────────────────────────────────────────────────────────────
public enum TypeConversation { PRIVEE, GROUPE }
public enum TypeMessage     { TEXTE, IMAGE, FICHIER, AUDIO, VIDEO, SYSTEME, APPEL }
public enum StatutEnLigne   { ENLIGNE, ABSENT, OCCUPE, HORSLIGNE }

// ── Minimal Utilisateur (read-only, maps to the shared Utilisateurs table) ────
public class ChatUtilisateur
{
    public long    IdUtilisateur { get; set; }
    public string  Nom          { get; set; } = string.Empty;
    public string  Prenom       { get; set; } = string.Empty;
    public string  Email        { get; set; } = string.Empty;
    public string? Photo        { get; set; }
    public bool    Actif        { get; set; }
}

// ── Conversation ──────────────────────────────────────────────────────────────
public class Conversation
{
    public long               IdConversation   { get; set; }
    public string?            Titre            { get; set; }
    public TypeConversation   TypeConversation { get; set; }
    public DateTime           DateCreation     { get; set; }
    public DateTime?          DernierMessageDate { get; set; }
    public long               CreatedByUserId  { get; set; }
    public string?            ImageGroupe      { get; set; }
    public bool               EstArchivee      { get; set; }

    public ICollection<Message>                 Messages     { get; set; } = new List<Message>();
    public ICollection<ConversationParticipant> Participants { get; set; } = new List<ConversationParticipant>();
}

// ── ConversationParticipant ───────────────────────────────────────────────────
public class ConversationParticipant
{
    public long            IdParticipant          { get; set; }
    public long            ConversationId         { get; set; }
    public Conversation    Conversation           { get; set; } = null!;
    public long            UtilisateurId          { get; set; }
    public ChatUtilisateur Utilisateur            { get; set; } = null!;
    public DateTime        DateAjout              { get; set; }
    public bool            EstAdmin               { get; set; }
    public bool            EstEpingle             { get; set; }
    public DateTime?       DerniereLecture        { get; set; }
    public bool            NotificationsActivees  { get; set; } = true;
    public string?         Pseudonyme             { get; set; }
}

// ── Message ───────────────────────────────────────────────────────────────────
public class Message
{
    public long            IdMessage         { get; set; }
    public string          Contenu           { get; set; } = string.Empty;
    public DateTime        DateEnvoi         { get; set; }
    public TypeMessage     TypeMessage       { get; set; }
    public long            ExpediteurId      { get; set; }
    public ChatUtilisateur Expediteur        { get; set; } = null!;
    public long            ConversationId    { get; set; }
    public Conversation    Conversation      { get; set; } = null!;
    public bool            EstLu             { get; set; }
    public DateTime?       DateLecture       { get; set; }
    public bool            EstSupprime       { get; set; }
    public bool            EstModifie        { get; set; }
    public DateTime?       DateModification  { get; set; }
    public bool            Epingle           { get; set; }
    public string?         CheminFichier     { get; set; }
    public string?         NomFichier        { get; set; }
    public long?           TailleFichier     { get; set; }
    public long?           ReponseAMessageId { get; set; }
    public Message?        MessageParent     { get; set; }

    public ICollection<MessageReaction> Reactions { get; set; } = new List<MessageReaction>();
    public ICollection<Message>         Reponses  { get; set; } = new List<Message>();
}

// ── MessageReaction ───────────────────────────────────────────────────────────
public class MessageReaction
{
    public long            IdReaction    { get; set; }
    public long            MessageId     { get; set; }
    public Message         Message       { get; set; } = null!;
    public long            UtilisateurId { get; set; }
    public ChatUtilisateur Utilisateur   { get; set; } = null!;
    public string          TypeReaction  { get; set; } = string.Empty;
    public DateTime        DateReaction  { get; set; }
}

// ── UtilisateurStatut ─────────────────────────────────────────────────────────
public class UtilisateurStatut
{
    public long            IdStatut         { get; set; }
    public long            UtilisateurId    { get; set; }
    public ChatUtilisateur Utilisateur      { get; set; } = null!;
    public StatutEnLigne   Statut           { get; set; }
    public DateTime        DerniereActivite { get; set; }
    public string?         MessageCustom    { get; set; }
    public string?         ConnectionId     { get; set; }
}

// ── DTOs ──────────────────────────────────────────────────────────────────────
public class MessageHubDto
{
    public long    IdMessage         { get; set; }
    public long    ConversationId    { get; set; }
    public long    ExpediteurId      { get; set; }
    public string  NomExpediteur     { get; set; } = string.Empty;
    public string  Contenu           { get; set; } = string.Empty;
    public string  TypeMessage       { get; set; } = "TEXTE";
    public bool    EstLu             { get; set; }
    public string  DateEnvoi         { get; set; } = string.Empty;
    public string? CheminFichier     { get; set; }
    public string? NomFichier        { get; set; }
    public long?   TailleFichier     { get; set; }
    public long?   ReponseAMessageId { get; set; }
    public string? AvatarUrl         { get; set; }
    public bool    Epingle           { get; set; }
}

public record CreatePrivateConvDto(long OtherUserId);
public record CreateGroupConvDto(string Titre, List<long> ParticipantIds);
public record ForwardMessageDto(long MessageId, long TargetConvId, string? Contenu);
