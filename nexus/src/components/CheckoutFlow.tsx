/**
 * CheckoutFlow - Complete End-to-End Booking & Payment Flow
 *
 * This component orchestrates the entire booking process:
 * 1. Display booking summary (flights, hotels, etc.)
 * 2. Collect customer information
 * 3. Process payment via Stripe Elements
 * 4. Confirm booking and show receipt
 *
 * Usage:
 * <CheckoutFlow
 *   booking={bookingData}
 *   onComplete={(result) => console.log('Booking complete:', result)}
 *   onCancel={() => navigate('/search')}
 * />
 */

import { useState } from 'react'
import StripeCheckout, { type PaymentSuccessResult } from './StripeCheckout'

export interface FlightBooking {
  type: 'flight'
  airline: string
  flightNumber: string
  departure: {
    airport: string
    city: string
    date: string
    time: string
  }
  arrival: {
    airport: string
    city: string
    date: string
    time: string
  }
  passengers: number
  class: string
  price: number
}

export interface HotelBooking {
  type: 'hotel'
  name: string
  location: string
  checkIn: string
  checkOut: string
  nights: number
  roomType: string
  guests: number
  pricePerNight: number
  totalPrice: number
  amenities: string[]
}

export interface BookingItem {
  id: string
  booking: FlightBooking | HotelBooking
}

export interface CustomerInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
}

export interface CheckoutResult {
  success: boolean
  bookingConfirmation: string
  paymentId: string
  totalAmount: number
  currency: string
  items: BookingItem[]
  customer: CustomerInfo
}

export interface CheckoutFlowProps {
  items: BookingItem[]
  currency?: string
  onComplete: (result: CheckoutResult) => void
  onCancel?: () => void
  className?: string
}

type CheckoutStep = 'review' | 'customer' | 'payment' | 'confirmation'

export function CheckoutFlow({
  items,
  currency = 'USD',
  onComplete,
  onCancel,
  className = '',
}: CheckoutFlowProps) {
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review')
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  })
  const [paymentResult, setPaymentResult] = useState<PaymentSuccessResult | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const price =
      item.booking.type === 'flight'
        ? item.booking.price
        : item.booking.totalPrice
    return sum + price
  }, 0)

  const serviceFee = subtotal * 0.05 // 5% service fee
  const taxes = subtotal * 0.08 // 8% taxes
  const total = subtotal + serviceFee + taxes

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const validateCustomerInfo = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!customerInfo.firstName.trim()) {
      newErrors.firstName = 'First name is required'
    }
    if (!customerInfo.lastName.trim()) {
      newErrors.lastName = 'Last name is required'
    }
    if (!customerInfo.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerInfo.email)) {
      newErrors.email = 'Invalid email format'
    }
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateCustomerInfo()) {
      setCurrentStep('payment')
    }
  }

  const handlePaymentSuccess = (result: PaymentSuccessResult) => {
    setPaymentResult(result)
    setCurrentStep('confirmation')

    // Generate booking confirmation
    const confirmationNumber = `NX${Date.now().toString(36).toUpperCase()}`

    onComplete({
      success: true,
      bookingConfirmation: confirmationNumber,
      paymentId: result.paymentIntentId,
      totalAmount: result.amount,
      currency: result.currency,
      items,
      customer: customerInfo,
    })
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
    // Stay on payment step, error will be shown in StripeCheckout
  }

  const renderStepIndicator = () => {
    const steps = [
      { key: 'review', label: 'Review' },
      { key: 'customer', label: 'Details' },
      { key: 'payment', label: 'Payment' },
      { key: 'confirmation', label: 'Done' },
    ]

    const currentIndex = steps.findIndex((s) => s.key === currentStep)

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                index <= currentIndex
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
              }`}
            >
              {index < currentIndex ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span
              className={`ml-2 text-sm ${
                index <= currentIndex
                  ? 'text-gray-900 dark:text-white font-medium'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {step.label}
            </span>
            {index < steps.length - 1 && (
              <div
                className={`w-12 h-0.5 mx-3 ${
                  index < currentIndex
                    ? 'bg-blue-600'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    )
  }

  const renderFlightItem = (flight: FlightBooking) => (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
        <svg
          className="w-6 h-6 text-blue-600 dark:text-blue-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">
              {flight.airline} {flight.flightNumber}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {flight.departure.city} ({flight.departure.airport}) → {flight.arrival.city} (
              {flight.arrival.airport})
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(flight.departure.date)} • {flight.departure.time} - {flight.arrival.time}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {flight.passengers} passenger(s) • {flight.class}
            </p>
          </div>
          <span className="font-semibold text-gray-900 dark:text-white">
            {formatCurrency(flight.price)}
          </span>
        </div>
      </div>
    </div>
  )

  const renderHotelItem = (hotel: HotelBooking) => (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
        <svg
          className="w-6 h-6 text-purple-600 dark:text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white">{hotel.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-300">{hotel.location}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(hotel.checkIn)} - {formatDate(hotel.checkOut)} • {hotel.nights} night(s)
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {hotel.roomType} • {hotel.guests} guest(s)
            </p>
          </div>
          <div className="text-right">
            <span className="font-semibold text-gray-900 dark:text-white">
              {formatCurrency(hotel.totalPrice)}
            </span>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {formatCurrency(hotel.pricePerNight)}/night
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderReviewStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Review Your Booking</h2>

      {/* Booking Items */}
      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
          >
            {item.booking.type === 'flight'
              ? renderFlightItem(item.booking)
              : renderHotelItem(item.booking)}
          </div>
        ))}
      </div>

      {/* Price Breakdown */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Service Fee</span>
          <span>{formatCurrency(serviceFee)}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-300">
          <span>Taxes & Fees</span>
          <span>{formatCurrency(taxes)}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-2">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          onClick={() => setCurrentStep('customer')}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  )

  const renderCustomerStep = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Customer Information</h2>

      <form onSubmit={handleCustomerSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={customerInfo.firstName}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, firstName: e.target.value }))
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={customerInfo.lastName}
              onChange={(e) =>
                setCustomerInfo((prev) => ({ ...prev, lastName: e.target.value }))
              }
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, email: e.target.value }))
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="john@example.com"
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) =>
              setCustomerInfo((prev) => ({ ...prev, phone: e.target.value }))
            }
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white ${
              errors.phone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="+1 (555) 123-4567"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
            <span>Total to Pay</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep('review')}
            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Continue to Payment
          </button>
        </div>
      </form>
    </div>
  )

  const renderPaymentStep = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCurrentStep('customer')}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <svg
            className="w-5 h-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment</h2>
      </div>

      <StripeCheckout
        amount={total}
        currency={currency}
        description={`Booking for ${customerInfo.firstName} ${customerInfo.lastName}`}
        customerEmail={customerInfo.email}
        customerName={`${customerInfo.firstName} ${customerInfo.lastName}`}
        metadata={{
          customerPhone: customerInfo.phone,
          bookingItems: items.length.toString(),
        }}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onCancel={() => setCurrentStep('customer')}
      />
    </div>
  )

  const renderConfirmationStep = () => (
    <div className="text-center space-y-6">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <svg
          className="w-10 h-10 text-green-600 dark:text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Booking Confirmed!
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Thank you for your booking, {customerInfo.firstName}!
        </p>
      </div>

      {/* Confirmation Details */}
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg text-left">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 dark:text-gray-400">Confirmation Number</p>
            <p className="font-mono font-bold text-gray-900 dark:text-white">
              NX{Date.now().toString(36).toUpperCase()}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Payment ID</p>
            <p className="font-mono text-gray-900 dark:text-white truncate">
              {paymentResult?.paymentIntentId}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Amount Paid</p>
            <p className="font-bold text-green-600 dark:text-green-400">
              {formatCurrency(paymentResult?.amount || total)}
            </p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400">Email</p>
            <p className="text-gray-900 dark:text-white">{customerInfo.email}</p>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        A confirmation email has been sent to {customerInfo.email}
      </p>

      {/* Actions */}
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          Print Receipt
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  )

  return (
    <div className={`checkout-flow max-w-2xl mx-auto p-6 ${className}`}>
      {renderStepIndicator()}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
        {currentStep === 'review' && renderReviewStep()}
        {currentStep === 'customer' && renderCustomerStep()}
        {currentStep === 'payment' && renderPaymentStep()}
        {currentStep === 'confirmation' && renderConfirmationStep()}
      </div>
    </div>
  )
}

export default CheckoutFlow
