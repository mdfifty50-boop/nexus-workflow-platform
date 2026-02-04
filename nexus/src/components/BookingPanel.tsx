/**
 * BookingPanel.tsx
 *
 * Booking integrations UI for travel and reservations.
 * Integrates with BookingService for flights, hotels, restaurants, and car rentals.
 *
 * SAFE: This is a NEW file - does not modify any protected code.
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plane,
  Hotel,
  UtensilsCrossed,
  Car,
  Search,
  Calendar,
  Users,
  MapPin,
  Star,
  Clock,
  ChevronRight,
  X,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  bookingService,
  type FlightResult,
  type HotelResult,
  type RestaurantResult,
  type CarRentalResult,
} from '@/services/BookingService'

type BookingTab = 'flights' | 'hotels' | 'restaurants' | 'cars'

interface BookingPanelProps {
  className?: string
  defaultTab?: BookingTab
  onBookingComplete?: (bookingId: string) => void
}

// Tab configuration
const TABS: Array<{
  id: BookingTab
  label: string
  icon: typeof Plane
  description: string
}> = [
  { id: 'flights', label: 'Flights', icon: Plane, description: 'Search flights worldwide' },
  { id: 'hotels', label: 'Hotels', icon: Hotel, description: 'Find your perfect stay' },
  { id: 'restaurants', label: 'Dining', icon: UtensilsCrossed, description: 'Book restaurant reservations' },
  { id: 'cars', label: 'Car Rental', icon: Car, description: 'Rent a car for your trip' },
]

export function BookingPanel({
  className = '',
  defaultTab = 'flights',
  onBookingComplete,
}: BookingPanelProps) {
  const [activeTab, setActiveTab] = useState<BookingTab>(defaultTab)
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<{
    flights: FlightResult[]
    hotels: HotelResult[]
    restaurants: RestaurantResult[]
    cars: CarRentalResult[]
  }>({
    flights: [],
    hotels: [],
    restaurants: [],
    cars: [],
  })

  return (
    <div className={`bg-surface-900/80 backdrop-blur-sm rounded-2xl border border-surface-700/50 overflow-hidden ${className}`}>
      {/* Tabs */}
      <div className="flex border-b border-surface-700/50 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 min-w-[120px] px-4 py-4 flex items-center justify-center gap-2
                transition-all duration-300
                ${isActive
                  ? 'bg-gradient-to-b from-cyan-500/10 to-transparent border-b-2 border-cyan-500 text-white'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800/50'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
              <span className="font-medium text-sm">{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'flights' && (
            <FlightSearch
              key="flights"
              isSearching={isSearching}
              setIsSearching={setIsSearching}
              results={results.flights}
              setResults={(flights) => setResults(prev => ({ ...prev, flights }))}
              onBookingComplete={onBookingComplete}
            />
          )}
          {activeTab === 'hotels' && (
            <HotelSearch
              key="hotels"
              isSearching={isSearching}
              setIsSearching={setIsSearching}
              results={results.hotels}
              setResults={(hotels) => setResults(prev => ({ ...prev, hotels }))}
              onBookingComplete={onBookingComplete}
            />
          )}
          {activeTab === 'restaurants' && (
            <RestaurantSearch
              key="restaurants"
              isSearching={isSearching}
              setIsSearching={setIsSearching}
              results={results.restaurants}
              setResults={(restaurants) => setResults(prev => ({ ...prev, restaurants }))}
              onBookingComplete={onBookingComplete}
            />
          )}
          {activeTab === 'cars' && (
            <CarRentalSearch
              key="cars"
              isSearching={isSearching}
              setIsSearching={setIsSearching}
              results={results.cars}
              setResults={(cars) => setResults(prev => ({ ...prev, cars }))}
              onBookingComplete={onBookingComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ========== Flight Search Component ==========
interface FlightSearchProps {
  isSearching: boolean
  setIsSearching: (v: boolean) => void
  results: FlightResult[]
  setResults: (v: FlightResult[]) => void
  onBookingComplete?: (bookingId: string) => void
}

function FlightSearch({ isSearching, setIsSearching, results, setResults, onBookingComplete }: FlightSearchProps) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [cabinClass, setCabinClass] = useState<'economy' | 'business' | 'first'>('economy')

  const handleSearch = useCallback(async () => {
    if (!origin || !destination || !departureDate) return

    setIsSearching(true)
    try {
      const flights = await bookingService.searchFlights({
        origin,
        destination,
        departureDate,
        returnDate: returnDate || undefined,
        passengers,
        cabinClass,
      })
      setResults(flights)
    } catch (err) {
      console.error('Flight search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [origin, destination, departureDate, returnDate, passengers, cabinClass, setIsSearching, setResults])

  const handleBook = useCallback(async (flight: FlightResult) => {
    try {
      const confirmation = await bookingService.bookFlight(flight.id, {
        passengers,
        contactEmail: 'user@example.com',
      })
      onBookingComplete?.(confirmation.bookingId)
    } catch (err) {
      console.error('Flight booking failed:', err)
    }
  }, [passengers, onBookingComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Search Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-surface-400">From</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="City or airport"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">To</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="City or airport"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Departure</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Return (optional)</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Passengers</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select
              value={passengers}
              onChange={(e) => setPassengers(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            >
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Passenger' : 'Passengers'}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Class</label>
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value as 'economy' | 'business' | 'first')}
            className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        disabled={isSearching || !origin || !destination || !departureDate}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
      >
        {isSearching ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Search className="w-5 h-5 mr-2" />
        )}
        Search Flights
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{results.length} flights found</h3>
          {results.slice(0, 5).map((flight) => (
            <div
              key={flight.id}
              className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-700 flex items-center justify-center">
                    <Plane className="w-6 h-6 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{flight.airline}</p>
                    <p className="text-sm text-surface-400">{flight.flightNumber} • {flight.duration}</p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-sm text-surface-400">{flight.departure.airport}</p>
                  <p className="font-medium text-white">{new Date(flight.departure.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-px w-16 bg-surface-600" />
                  <span className="text-xs text-surface-500">{flight.stops === 0 ? 'Direct' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
                  <div className="h-px w-16 bg-surface-600" />
                </div>

                <div className="text-center">
                  <p className="text-sm text-surface-400">{flight.arrival.airport}</p>
                  <p className="font-medium text-white">{new Date(flight.arrival.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="text-right">
                  <p className="text-lg font-bold text-white">${flight.price}</p>
                  <Button
                    size="sm"
                    onClick={() => handleBook(flight)}
                    className="mt-1"
                  >
                    Book <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ========== Hotel Search Component ==========
interface HotelSearchProps {
  isSearching: boolean
  setIsSearching: (v: boolean) => void
  results: HotelResult[]
  setResults: (v: HotelResult[]) => void
  onBookingComplete?: (bookingId: string) => void
}

function HotelSearch({ isSearching, setIsSearching, results, setResults, onBookingComplete }: HotelSearchProps) {
  const [location, setLocation] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [rooms, setRooms] = useState(1)

  const handleSearch = useCallback(async () => {
    if (!location || !checkIn || !checkOut) return

    setIsSearching(true)
    try {
      const hotels = await bookingService.searchHotels({
        location,
        checkIn,
        checkOut,
        guests,
        rooms,
      })
      setResults(hotels)
    } catch (err) {
      console.error('Hotel search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [location, checkIn, checkOut, guests, rooms, setIsSearching, setResults])

  const handleBook = useCallback(async (hotel: HotelResult) => {
    try {
      const confirmation = await bookingService.bookHotel(hotel.id, 'Standard Room', {
        guests,
        contactEmail: 'user@example.com',
      })
      onBookingComplete?.(confirmation.bookingId)
    } catch (err) {
      console.error('Hotel booking failed:', err)
    }
  }, [guests, onBookingComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm text-surface-400">Destination</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, hotel, or landmark"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Check-in</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Check-out</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
          >
            {[1, 2, 3, 4, 5, 6].map(n => (
              <option key={n} value={n}>{n} Guest{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Rooms</label>
          <select
            value={rooms}
            onChange={(e) => setRooms(parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
          >
            {[1, 2, 3, 4].map(n => (
              <option key={n} value={n}>{n} Room{n > 1 ? 's' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        disabled={isSearching || !location || !checkIn || !checkOut}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
      >
        {isSearching ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Search className="w-5 h-5 mr-2" />
        )}
        Search Hotels
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{results.length} hotels found</h3>
          {results.slice(0, 5).map((hotel) => (
            <div
              key={hotel.id}
              className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <Hotel className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{hotel.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex">
                        {[...Array(hotel.starRating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                      <span className="text-sm text-surface-400">
                        {hotel.userRating.toFixed(1)} ({hotel.reviewCount} reviews)
                      </span>
                    </div>
                    <p className="text-sm text-surface-500 mt-1">{hotel.address}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {hotel.amenities.slice(0, 4).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2 py-0.5 rounded-full bg-surface-700 text-xs text-surface-300"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-surface-400">per night</p>
                  <p className="text-xl font-bold text-white">${hotel.pricePerNight}</p>
                  <p className="text-sm text-surface-500">${hotel.totalPrice} total</p>
                  <Button
                    size="sm"
                    onClick={() => handleBook(hotel)}
                    className="mt-2"
                  >
                    Book <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ========== Restaurant Search Component ==========
interface RestaurantSearchProps {
  isSearching: boolean
  setIsSearching: (v: boolean) => void
  results: RestaurantResult[]
  setResults: (v: RestaurantResult[]) => void
  onBookingComplete?: (bookingId: string) => void
}

function RestaurantSearch({ isSearching, setIsSearching, results, setResults, onBookingComplete }: RestaurantSearchProps) {
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('19:00')
  const [partySize, setPartySize] = useState(2)

  const handleSearch = useCallback(async () => {
    if (!location || !date) return

    setIsSearching(true)
    try {
      const restaurants = await bookingService.searchRestaurants({
        location,
        date,
        time,
        partySize,
      })
      setResults(restaurants)
    } catch (err) {
      console.error('Restaurant search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [location, date, time, partySize, setIsSearching, setResults])

  const handleReservation = useCallback(async (restaurant: RestaurantResult, selectedTime: string) => {
    try {
      const confirmation = await bookingService.makeReservation(
        restaurant.id,
        date,
        selectedTime,
        partySize,
        { contactEmail: 'user@example.com' }
      )
      onBookingComplete?.(confirmation.bookingId)
    } catch (err) {
      console.error('Reservation failed:', err)
    }
  }, [date, partySize, onBookingComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-surface-400">Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or neighborhood"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-surface-400">Party Size</label>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select
              value={partySize}
              onChange={(e) => setPartySize(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                <option key={n} value={n}>{n} {n === 1 ? 'Person' : 'People'}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        disabled={isSearching || !location || !date}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
      >
        {isSearching ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Search className="w-5 h-5 mr-2" />
        )}
        Find Restaurants
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{results.length} restaurants found</h3>
          {results.slice(0, 5).map((restaurant) => (
            <div
              key={restaurant.id}
              className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <UtensilsCrossed className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{restaurant.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        <span className="ml-1 text-sm text-white">{restaurant.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-surface-500">•</span>
                      <span className="text-sm text-surface-400">{restaurant.reviewCount} reviews</span>
                      <span className="text-surface-500">•</span>
                      <span className="text-sm text-surface-400">{restaurant.priceRange}</span>
                    </div>
                    <p className="text-sm text-surface-500 mt-1">{restaurant.cuisine.join(', ')}</p>
                    <p className="text-xs text-surface-500">{restaurant.address}</p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-surface-400 mb-2">Available times</p>
                  <div className="flex flex-wrap gap-1 justify-end">
                    {restaurant.availableTimes.slice(0, 4).map((t) => (
                      <button
                        key={t}
                        onClick={() => handleReservation(restaurant, t)}
                        className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ========== Car Rental Search Component ==========
interface CarRentalSearchProps {
  isSearching: boolean
  setIsSearching: (v: boolean) => void
  results: CarRentalResult[]
  setResults: (v: CarRentalResult[]) => void
  onBookingComplete?: (bookingId: string) => void
}

function CarRentalSearch({ isSearching, setIsSearching, results, setResults, onBookingComplete }: CarRentalSearchProps) {
  const [pickupLocation, setPickupLocation] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [dropoffDate, setDropoffDate] = useState('')
  const [pickupTime, setPickupTime] = useState('10:00')
  const [dropoffTime, setDropoffTime] = useState('10:00')

  const handleSearch = useCallback(async () => {
    if (!pickupLocation || !pickupDate || !dropoffDate) return

    setIsSearching(true)
    try {
      const cars = await bookingService.searchCarRentals({
        pickupLocation,
        pickupDate,
        pickupTime,
        dropoffDate,
        dropoffTime,
      })
      setResults(cars)
    } catch (err) {
      console.error('Car rental search failed:', err)
    } finally {
      setIsSearching(false)
    }
  }, [pickupLocation, pickupDate, pickupTime, dropoffDate, dropoffTime, setIsSearching, setResults])

  const handleBook = useCallback(async (car: CarRentalResult) => {
    try {
      const confirmation = await bookingService.bookCarRental(car.id, {
        driverName: 'User',
        contactEmail: 'user@example.com',
      })
      onBookingComplete?.(confirmation.bookingId)
    } catch (err) {
      console.error('Car rental booking failed:', err)
    }
  }, [onBookingComplete])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-2 lg:col-span-2">
          <label className="text-sm text-surface-400">Pick-up Location</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="Airport, city, or address"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white placeholder:text-surface-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-2">
            <label className="text-sm text-surface-400">Pick-up Date</label>
            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-surface-400">Time</label>
            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 lg:col-span-2">
          <div className="space-y-2">
            <label className="text-sm text-surface-400">Drop-off Date</label>
            <input
              type="date"
              value={dropoffDate}
              onChange={(e) => setDropoffDate(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-surface-400">Time</label>
            <input
              type="time"
              value={dropoffTime}
              onChange={(e) => setDropoffTime(e.target.value)}
              className="w-full px-3 py-3 rounded-xl bg-surface-800 border border-surface-700 text-white focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        disabled={isSearching || !pickupLocation || !pickupDate || !dropoffDate}
        className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
      >
        {isSearching ? (
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
        ) : (
          <Search className="w-5 h-5 mr-2" />
        )}
        Search Cars
      </Button>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{results.length} cars found</h3>
          {results.slice(0, 5).map((car) => (
            <div
              key={car.id}
              className="p-4 rounded-xl bg-surface-800/50 border border-surface-700 hover:border-cyan-500/50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-surface-700 flex items-center justify-center">
                    <Car className="w-8 h-8 text-cyan-400" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{car.carModel}</p>
                    <p className="text-sm text-surface-400">{car.company} • {car.carType}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {car.features.slice(0, 4).map((feature) => (
                        <span
                          key={feature}
                          className="px-2 py-0.5 rounded-full bg-surface-700 text-xs text-surface-300"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-surface-400">${car.pricePerDay}/day</p>
                  <p className="text-xl font-bold text-white">${car.totalPrice} total</p>
                  <Button
                    size="sm"
                    onClick={() => handleBook(car)}
                    className="mt-2"
                  >
                    Book <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// Compact version for sidebar or smaller spaces
export function BookingQuickAccess({ className = '' }: { className?: string }) {
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowPanel(true)}
        className={`
          p-4 rounded-xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10
          border border-cyan-500/20 hover:border-cyan-500/40
          transition-all duration-300 text-left
          ${className}
        `}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <Plane className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <p className="font-medium text-white">Travel Booking</p>
            <p className="text-sm text-surface-400">Flights, Hotels, Dining</p>
          </div>
          <ChevronRight className="w-5 h-5 text-surface-500 ml-auto" />
        </div>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setShowPanel(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-surface-800 text-surface-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <BookingPanel onBookingComplete={() => setShowPanel(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default BookingPanel
