/**
 * Voice Pipeline Integration Test
 *
 * Tests the complete voice processing pipeline:
 * - DeepgramService (STT)
 * - ElevenLabsService (TTS)
 * - VoiceNoteHandler (integration)
 *
 * @NEXUS-FIX-085: Voice pipeline validation tests
 *
 * Run with: npx tsx server/tests/voice-pipeline.test.ts
 */

import DeepgramService from '../services/DeepgramService'
import ElevenLabsService from '../services/ElevenLabsService'
import VoiceNoteHandler from '../services/VoiceNoteHandler'

// =============================================================================
// TEST UTILITIES
// =============================================================================

const log = (msg: string) => console.log(`[TEST] ${msg}`)
const pass = (name: string) => console.log(`  ✅ PASS: ${name}`)
const fail = (name: string, error?: string) => console.log(`  ❌ FAIL: ${name}${error ? ` - ${error}` : ''}`)
const skip = (name: string, reason: string) => console.log(`  ⏭️ SKIP: ${name} - ${reason}`)

interface TestResult {
  name: string
  passed: boolean
  skipped?: boolean
  error?: string
}

const results: TestResult[] = []

// =============================================================================
// TESTS
// =============================================================================

async function testDeepgramService(): Promise<void> {
  log('\n📝 Testing DeepgramService...')

  // Test 1: Initialization
  try {
    await DeepgramService.initialize()
    if (DeepgramService.isReady()) {
      pass('Deepgram initialized via Composio')
    } else {
      pass('Deepgram in demo mode (no Composio connection)')
    }
    results.push({ name: 'DeepgramService initialization', passed: true })
  } catch (error) {
    fail('Deepgram initialization', String(error))
    results.push({ name: 'DeepgramService initialization', passed: false, error: String(error) })
  }

  // Test 2: Supported formats
  try {
    const formats = DeepgramService.getSupportedFormats()
    if (formats.includes('ogg') && formats.includes('mp3')) {
      pass(`Supported formats: ${formats.join(', ')}`)
      results.push({ name: 'DeepgramService formats', passed: true })
    } else {
      fail('Missing expected audio formats')
      results.push({ name: 'DeepgramService formats', passed: false })
    }
  } catch (error) {
    fail('Supported formats check', String(error))
    results.push({ name: 'DeepgramService formats', passed: false, error: String(error) })
  }

  // Test 3: Supported languages
  try {
    const languages = DeepgramService.getSupportedLanguages()
    if (languages.includes('ar-AE') && languages.includes('en-US')) {
      pass(`Supported languages: ${languages.join(', ')}`)
      results.push({ name: 'DeepgramService languages', passed: true })
    } else {
      fail('Missing expected languages')
      results.push({ name: 'DeepgramService languages', passed: false })
    }
  } catch (error) {
    fail('Supported languages check', String(error))
    results.push({ name: 'DeepgramService languages', passed: false, error: String(error) })
  }

  // Test 4: Demo mode transcription
  if (!DeepgramService.isReady()) {
    try {
      const result = await DeepgramService.transcribe('demo://test.ogg', 'en-US')
      if (result.success && result.text) {
        pass('Demo mode transcription works')
        results.push({ name: 'DeepgramService demo transcription', passed: true })
      } else {
        fail('Demo transcription failed', result.error)
        results.push({ name: 'DeepgramService demo transcription', passed: false, error: result.error })
      }
    } catch (error) {
      fail('Demo transcription', String(error))
      results.push({ name: 'DeepgramService demo transcription', passed: false, error: String(error) })
    }
  } else {
    skip('Demo transcription', 'Deepgram is connected (not in demo mode)')
    results.push({ name: 'DeepgramService demo transcription', passed: true, skipped: true })
  }
}

async function testElevenLabsService(): Promise<void> {
  log('\n🎙️ Testing ElevenLabsService...')

  // Test 1: Initialization
  try {
    await ElevenLabsService.initialize()
    if (ElevenLabsService.isReady()) {
      pass('ElevenLabs initialized via Composio')
    } else {
      pass('ElevenLabs in demo mode (no Composio connection)')
    }
    results.push({ name: 'ElevenLabsService initialization', passed: true })
  } catch (error) {
    fail('ElevenLabs initialization', String(error))
    results.push({ name: 'ElevenLabsService initialization', passed: false, error: String(error) })
  }

  // Test 2: Get voices
  try {
    const voiceResult = await ElevenLabsService.getVoices()
    if (voiceResult.success && voiceResult.voices && voiceResult.voices.length > 0) {
      pass(`Available voices: ${voiceResult.voices.length} (${voiceResult.voices.map(v => v.name).join(', ')})`)
      results.push({ name: 'ElevenLabsService get voices', passed: true })
    } else {
      fail('No voices returned', voiceResult.error)
      results.push({ name: 'ElevenLabsService get voices', passed: false, error: voiceResult.error })
    }
  } catch (error) {
    fail('Get voices', String(error))
    results.push({ name: 'ElevenLabsService get voices', passed: false, error: String(error) })
  }

  // Test 3: Recommended voices
  try {
    const arabicVoice = ElevenLabsService.getRecommendedVoice('ar-AE')
    const englishVoice = ElevenLabsService.getRecommendedVoice('en-US')

    if (arabicVoice && englishVoice) {
      pass(`Recommended voices: Arabic=${arabicVoice.name}, English=${englishVoice.name}`)
      results.push({ name: 'ElevenLabsService recommended voices', passed: true })
    } else {
      fail('Missing recommended voices')
      results.push({ name: 'ElevenLabsService recommended voices', passed: false })
    }
  } catch (error) {
    fail('Recommended voices', String(error))
    results.push({ name: 'ElevenLabsService recommended voices', passed: false, error: String(error) })
  }

  // Test 4: Demo mode synthesis
  if (!ElevenLabsService.isReady()) {
    try {
      const result = await ElevenLabsService.synthesize('Hello, this is a test.')
      if (result.success) {
        pass('Demo mode synthesis works')
        results.push({ name: 'ElevenLabsService demo synthesis', passed: true })
      } else {
        fail('Demo synthesis failed', result.error)
        results.push({ name: 'ElevenLabsService demo synthesis', passed: false, error: result.error })
      }
    } catch (error) {
      fail('Demo synthesis', String(error))
      results.push({ name: 'ElevenLabsService demo synthesis', passed: false, error: String(error) })
    }
  } else {
    skip('Demo synthesis', 'ElevenLabs is connected (not in demo mode)')
    results.push({ name: 'ElevenLabsService demo synthesis', passed: true, skipped: true })
  }

  // Test 5: WhatsApp-optimized synthesis
  try {
    const result = await ElevenLabsService.synthesizeForWhatsApp('Test message', 'en')
    if (result.success) {
      pass('WhatsApp-optimized synthesis configured correctly')
      results.push({ name: 'ElevenLabsService WhatsApp synthesis', passed: true })
    } else {
      fail('WhatsApp synthesis failed', result.error)
      results.push({ name: 'ElevenLabsService WhatsApp synthesis', passed: false, error: result.error })
    }
  } catch (error) {
    fail('WhatsApp synthesis', String(error))
    results.push({ name: 'ElevenLabsService WhatsApp synthesis', passed: false, error: String(error) })
  }
}

async function testVoiceNoteHandler(): Promise<void> {
  log('\n🔊 Testing VoiceNoteHandler...')

  // Test 1: Initialization
  try {
    await VoiceNoteHandler.initialize()
    if (VoiceNoteHandler.isReady()) {
      pass('VoiceNoteHandler initialized (Deepgram connected)')
    } else {
      pass('VoiceNoteHandler in demo mode')
    }
    results.push({ name: 'VoiceNoteHandler initialization', passed: true })
  } catch (error) {
    fail('VoiceNoteHandler initialization', String(error))
    results.push({ name: 'VoiceNoteHandler initialization', passed: false, error: String(error) })
  }

  // Test 2: Supported formats validation
  try {
    const formats = VoiceNoteHandler.getSupportedFormats()
    if (formats.includes('audio/ogg') && formats.includes('audio/mpeg')) {
      pass(`Supported formats: ${formats.join(', ')}`)
      results.push({ name: 'VoiceNoteHandler formats', passed: true })
    } else {
      fail('Missing expected formats')
      results.push({ name: 'VoiceNoteHandler formats', passed: false })
    }
  } catch (error) {
    fail('Supported formats', String(error))
    results.push({ name: 'VoiceNoteHandler formats', passed: false, error: String(error) })
  }

  // Test 3: Format validation
  try {
    const oggValid = VoiceNoteHandler.isSupported('audio/ogg')
    const mp3Valid = VoiceNoteHandler.isSupported('audio/mpeg')
    const pdfInvalid = !VoiceNoteHandler.isSupported('application/pdf')

    if (oggValid && mp3Valid && pdfInvalid) {
      pass('Format validation works correctly')
      results.push({ name: 'VoiceNoteHandler format validation', passed: true })
    } else {
      fail('Format validation incorrect')
      results.push({ name: 'VoiceNoteHandler format validation', passed: false })
    }
  } catch (error) {
    fail('Format validation', String(error))
    results.push({ name: 'VoiceNoteHandler format validation', passed: false, error: String(error) })
  }

  // Test 4: Language detection
  try {
    const arabicLang = VoiceNoteHandler.detectLanguage('مرحبا كيف حالك')
    const englishLang = VoiceNoteHandler.detectLanguage('Hello, how are you?')

    if (arabicLang === 'ar' && englishLang === 'en') {
      pass('Language detection works correctly')
      results.push({ name: 'VoiceNoteHandler language detection', passed: true })
    } else {
      fail(`Language detection failed: Arabic=${arabicLang}, English=${englishLang}`)
      results.push({ name: 'VoiceNoteHandler language detection', passed: false })
    }
  } catch (error) {
    fail('Language detection', String(error))
    results.push({ name: 'VoiceNoteHandler language detection', passed: false, error: String(error) })
  }

  // Test 5: Voice response generation (demo mode)
  try {
    const result = await VoiceNoteHandler.generateVoiceResponse('Test message', 'en')
    if (result.success) {
      pass('Voice response generation works')
      results.push({ name: 'VoiceNoteHandler voice response', passed: true })
    } else {
      fail('Voice response generation failed', result.error)
      results.push({ name: 'VoiceNoteHandler voice response', passed: false, error: result.error })
    }
  } catch (error) {
    fail('Voice response generation', String(error))
    results.push({ name: 'VoiceNoteHandler voice response', passed: false, error: String(error) })
  }
}

// =============================================================================
// MAIN
// =============================================================================

async function runTests(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════╗')
  console.log('║           NEXUS VOICE PIPELINE TEST SUITE                    ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')
  console.log('║  Testing: DeepgramService, ElevenLabsService, VoiceNoteHandler║')
  console.log('╚══════════════════════════════════════════════════════════════╝')

  await testDeepgramService()
  await testElevenLabsService()
  await testVoiceNoteHandler()

  // Summary
  console.log('\n╔══════════════════════════════════════════════════════════════╗')
  console.log('║                      TEST SUMMARY                            ║')
  console.log('╠══════════════════════════════════════════════════════════════╣')

  const passed = results.filter(r => r.passed && !r.skipped).length
  const failed = results.filter(r => !r.passed).length
  const skipped = results.filter(r => r.skipped).length
  const total = results.length

  console.log(`║  Total: ${total} | Passed: ${passed} | Failed: ${failed} | Skipped: ${skipped}`)
  console.log('╚══════════════════════════════════════════════════════════════╝')

  if (failed > 0) {
    console.log('\n❌ FAILURES:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error || 'Unknown error'}`)
    })
    process.exit(1)
  } else {
    console.log('\n✅ ALL TESTS PASSED!')
    process.exit(0)
  }
}

runTests().catch(error => {
  console.error('Test suite failed:', error)
  process.exit(1)
})
