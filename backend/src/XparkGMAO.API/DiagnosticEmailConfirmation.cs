using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using XparkGMAO.Infrastructure.Data;

namespace XparkGMAO.API
{
    /// <summary>
    /// Temporary diagnostic endpoint to check and fix email confirmation issues
    /// </summary>
    public static class DiagnosticEmailConfirmation
    {
        public static async Task CheckAndFixEmailConfirmation(XparkDbContext context, string email)
        {
            var user = await context.Utilisateurs.FirstOrDefaultAsync(u => u.Email == email);
            
            if (user == null)
            {
                Console.WriteLine($"[DIAGNOSTIC] User with email {email} not found");
                return;
            }

            Console.WriteLine($"[DIAGNOSTIC] User: {email}");
            Console.WriteLine($"[DIAGNOSTIC] EmailConfirmed: {user.EmailConfirmed}");
            Console.WriteLine($"[DIAGNOSTIC] EmailConfirmationToken: {user.EmailConfirmationToken}");
            Console.WriteLine($"[DIAGNOSTIC] EmailConfirmationTokenExpiry: {user.EmailConfirmationTokenExpiry}");

            if (!user.EmailConfirmed)
            {
                // Automatically confirm the email
                user.EmailConfirmed = true;
                user.EmailConfirmationToken = null;
                user.EmailConfirmationTokenExpiry = null;
                await context.SaveChangesAsync();
                Console.WriteLine($"[DIAGNOSTIC] Email confirmed for {email}");
            }
        }
    }
}
