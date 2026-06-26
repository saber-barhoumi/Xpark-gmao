namespace XparkGMAO.Core.Entities.Chat
{
    public enum TypeConversation
    {
        PRIVEE = 1,    // Conversation 1-1
        GROUPE = 2     // Conversation de groupe
    }

    public enum TypeMessage
    {
        TEXTE = 1,
        IMAGE = 2,
        FICHIER = 3,
        AUDIO = 4,
        VIDEO = 5,
        SYSTEME = 6,   // Messages système (X a rejoint, Y a quitté)
        APPEL = 7      // Historique des appels audio/vidéo
    }

    public enum StatutEnLigne
    {
        ENLIGNE = 1,
        ABSENT = 2,
        OCCUPE = 3,
        HORSLIGNE = 4
    }
}
