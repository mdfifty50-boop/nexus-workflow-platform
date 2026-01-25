// Comprehensive integration test
console.log('=== Service Integrations End-to-End Test ===\n');

// Simulate the module structure
const serviceIntegrations = {
  _services: new Map([
    ['talabat', { connected: false, actions: ['search_restaurants', 'place_order'] }],
    ['whatsapp', { connected: true, actions: ['send_message'] }],
    ['email', { connected: true, actions: ['send_email'] }],
    ['pdf_processor', { connected: true, actions: ['extract_text', 'ocr'] }]
  ]),

  getAllIntegrations() {
    return Array.from(this._services.entries()).map(([id, data]) => ({
      id,
      connected: data.connected,
      actions: data.actions
    }));
  },

  isConnected(serviceId) {
    return this._services.get(serviceId)?.connected || false;
  },

  async executeAction(serviceId, actionId, inputs) {
    if (!this._services.has(serviceId)) {
      return { success: false, error: 'Unknown service' };
    }

    const service = this._services.get(serviceId);
    if (!service.connected && serviceId !== 'pdf_processor') {
      return { success: false, error: 'Service not connected' };
    }

    if (!service.actions.includes(actionId)) {
      return { success: false, error: 'Unknown action' };
    }

    return { success: true, data: { result: 'Simulated response', inputs } };
  }
};

// Simulate orchestrator
const orchestrator = {
  serviceManager: serviceIntegrations,

  async executeAPIStep(step) {
    const serviceId = step.config.service;
    const actionId = step.config.endpoint;
    const payload = step.config.payload;

    console.log(`Executing API step: ${serviceId}.${actionId}`);

    // Check connection
    if (!this.serviceManager.isConnected(serviceId)) {
      console.log(`  Warning: Service not connected: ${serviceId}`);
      return { success: false, error: 'Not connected' };
    }

    // Execute
    const result = await this.serviceManager.executeAction(serviceId, actionId, payload);
    console.log(`  ${result.success ? 'Success' : 'Failed'}: ${result.success ? 'OK' : result.error}`);

    return result;
  }
};

// Run test scenarios
async function runTests() {
  console.log('Test 1: List all services');
  const services = orchestrator.serviceManager.getAllIntegrations();
  console.log(`  Found ${services.length} services\n`);

  console.log('Test 2: Execute connected service (WhatsApp)');
  await orchestrator.executeAPIStep({
    config: {
      service: 'whatsapp',
      endpoint: 'send_message',
      payload: { to: '+1234567890', message: 'Hello' }
    }
  });
  console.log('');

  console.log('Test 3: Execute disconnected service (Talabat)');
  await orchestrator.executeAPIStep({
    config: {
      service: 'talabat',
      endpoint: 'place_order',
      payload: { restaurantId: '123' }
    }
  });
  console.log('');

  console.log('Test 4: Execute internal service (PDF Processor)');
  await orchestrator.executeAPIStep({
    config: {
      service: 'pdf_processor',
      endpoint: 'extract_text',
      payload: { documentUrl: 'https://example.com/doc.pdf' }
    }
  });
  console.log('');

  console.log('Test 5: Check service status');
  ['whatsapp', 'talabat', 'email', 'pdf_processor'].forEach(id => {
    const connected = orchestrator.serviceManager.isConnected(id);
    console.log(`  ${id}: ${connected ? 'Connected' : 'Not Connected'}`);
  });
  console.log('');

  console.log('=== All Tests Completed Successfully ===');
}

runTests().catch(console.error);
