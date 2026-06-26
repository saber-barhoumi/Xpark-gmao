using AutoMapper;
using XparkGMAO.Core.DTOs.Request;
using XparkGMAO.Core.DTOs.Response;
using XparkGMAO.Core.Entities.FrontOffice;
using XparkGMAO.Core.Interfaces.Repositories;
using XparkGMAO.Core.Interfaces.Services;

namespace XparkGMAO.Application.Services;

/// <summary>
/// Service de gestion des réservations
/// </summary>
public class ReservationService
{
    private readonly IReservationRepository _reservationRepository;
    private readonly IMapper _mapper;

    public ReservationService(IReservationRepository reservationRepository, IMapper mapper)
    {
        _reservationRepository = reservationRepository;
        _mapper = mapper;
    }

    public async Task<IEnumerable<ReservationResponseDto>> GetAllAsync()
    {
        var reservations = await _reservationRepository.GetAllAsync();
        return reservations.Select(r => _mapper.Map<ReservationResponseDto>(r));
    }

    public async Task<ReservationResponseDto?> GetByIdAsync(long id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        return reservation == null ? null : _mapper.Map<ReservationResponseDto>(reservation);
    }

    public async Task<IEnumerable<ReservationResponseDto>> GetByClientAsync(long clientId)
    {
        var reservations = await _reservationRepository.GetByClientAsync(clientId);
        return reservations.Select(r => _mapper.Map<ReservationResponseDto>(r));
    }

    public async Task<ReservationResponseDto> CreateAsync(CreateReservationDto dto)
    {
        var reservation = new Reservation
        {
            ClientId = dto.ClientId,
            VehiculeId = dto.VehiculeId,
            DateDebut = DateTime.SpecifyKind(dto.DateDebut, DateTimeKind.Utc),
            DateFin = DateTime.SpecifyKind(dto.DateFin, DateTimeKind.Utc),
            ChauffeurRequis = dto.ChauffeurRequis,
            Destination = dto.Destination,
            Observations = dto.Observations,
            Statut = StatutReservation.EN_ATTENTE,
            DateCreation = DateTime.UtcNow
        };

        var created = await _reservationRepository.AddAsync(reservation);
        return _mapper.Map<ReservationResponseDto>(created);
    }

    public async Task<bool> ConfirmerAsync(long id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null) return false;

        reservation.Statut = StatutReservation.CONFIRMEE;
        await _reservationRepository.UpdateAsync(reservation);
        return true;
    }

    public async Task<bool> AnnulerAsync(long id)
    {
        var reservation = await _reservationRepository.GetByIdAsync(id);
        if (reservation == null) return false;

        reservation.Statut = StatutReservation.ANNULEE;
        await _reservationRepository.UpdateAsync(reservation);
        return true;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var exists = await _reservationRepository.ExistsAsync(id);
        if (!exists) return false;

        await _reservationRepository.DeleteAsync(id);
        return true;
    }
}
