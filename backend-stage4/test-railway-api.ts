import axios, { AxiosResponse } from 'axios';

const BASE_URL = 'https://hng13internship-production-a451.up.railway.app';

interface TestResult {
  name: string;
  passed: boolean;
  statusCode?: number;
  expectedStatus?: number;
  response?: any;
  error?: string;
}

class APITester {
  private results: TestResult[] = [];
  private userId: string = '';
  private templateCode: string = '';
  private notificationId: string = '';

  private log(message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
    };
    const reset = '\x1b[0m';
    console.log(`${colors[type]}${message}${reset}`);
  }

  private async makeRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    expectedStatus: number = 200
  ): Promise<{ response: AxiosResponse | null; error: any }> {
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        data,
        headers: {
          'Content-Type': 'application/json',
        },
        validateStatus: () => true, // Don't throw on any status
      };

      const response = await axios(config);
      return { response, error: null };
    } catch (error: any) {
      return { response: null, error };
    }
  }

  private recordResult(result: TestResult) {
    this.results.push(result);
    if (result.passed) {
      this.log(`✓ ${result.name}`, 'success');
    } else {
      this.log(`✗ ${result.name}`, 'error');
      if (result.error) {
        this.log(`  Error: ${result.error}`, 'error');
      }
    }
  }

  private async test(
    name: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    expectedStatus: number,
    data?: any
  ): Promise<any> {
    this.log(`\nTesting: ${name}`, 'info');
    this.log(`${method} ${endpoint}`, 'info');

    const { response, error } = await this.makeRequest(method, endpoint, data, expectedStatus);

    if (error) {
      this.recordResult({
        name,
        passed: false,
        error: error.message,
      });
      return null;
    }

    const passed = response!.status === expectedStatus;
    
    this.recordResult({
      name,
      passed,
      statusCode: response!.status,
      expectedStatus,
      response: response!.data,
    });

    if (response!.data) {
      console.log('Response:', JSON.stringify(response!.data, null, 2));
    }

    return response!.data;
  }

  async runTests() {
    this.log('==========================================', 'info');
    this.log('Railway Deployment Test Suite', 'info');
    this.log(`Base URL: ${BASE_URL}`, 'info');
    this.log('==========================================', 'info');

    // Test 1: Health Check
    this.log('\n=== 1. HEALTH CHECKS ===', 'warning');
    await this.test('Health Check', 'GET', '/health', 200);

    // Test 2: API Root
    this.log('\n=== 2. API ROOT ===', 'warning');
    await this.test('API Root', 'GET', '/', 200);

    // Test 3: Create User
    this.log('\n=== 3. USER MANAGEMENT ===', 'warning');
    const randomId = Math.floor(Math.random() * 1000000);
    const testEmail = `testuser${randomId}@example.com`;
    
    const userData = {
      name: 'Test User',
      email: testEmail,
      password: 'Test@1234',
      preferences: {
        email: true,
        push: true,
      },
    };

    const userResponse = await this.test(
      'Create User',
      'POST',
      '/api/v1/users',
      201,
      userData
    );

    if (userResponse?.data) {
      this.userId = userResponse.data.id || userResponse.data.user_id || '';
      this.log(`User ID: ${this.userId}`, 'success');
    }

    // Test 4: List Users
    await this.test('List Users', 'GET', '/api/v1/users?page=1&limit=10', 200);

    // Test 5: Get User by ID
    if (this.userId) {
      await this.test('Get User by ID', 'GET', `/api/v1/users/${this.userId}`, 200);
    }

    // Test 6: Create Template
    this.log('\n=== 4. TEMPLATE MANAGEMENT ===', 'warning');
    const templateData = {
      name: 'Welcome Email',
      code: `welcome_email_${randomId}`,
      type: 'email',
      subject: 'Welcome to Our Platform, {{name}}!',
      content:
        'Hello {{name}},\n\nWelcome to our platform! Click here: {{link}}\n\nBest regards,\nThe Team',
      variables: ['name', 'link'],
      language: 'en',
    };

    const templateResponse = await this.test(
      'Create Email Template',
      'POST',
      '/api/v1/templates',
      201,
      templateData
    );

    if (templateResponse?.data) {
      this.templateCode = templateResponse.data.code || templateData.code;
      this.log(`Template Code: ${this.templateCode}`, 'success');
    }

    // Test 7: List Templates
    await this.test('List Templates', 'GET', '/api/v1/templates?page=1&limit=10', 200);

    // Test 8: Get Template by Code
    if (this.templateCode) {
      await this.test(
        'Get Template by Code',
        'GET',
        `/api/v1/templates/${this.templateCode}`,
        200
      );
    }

    // Test 9: Send Email Notification
    this.log('\n=== 5. NOTIFICATION SENDING ===', 'warning');
    if (this.userId && this.templateCode) {
      const notificationData = {
        notification_type: 'email',
        user_id: this.userId,
        template_code: this.templateCode,
        variables: {
          name: 'Test User',
          link: 'https://example.com/welcome',
        },
        request_id: `req-${Date.now()}-${randomId}`,
        priority: 1,
        metadata: {
          campaign: 'onboarding',
          source: 'railway-test',
        },
      };

      const notifResponse = await this.test(
        'Send Email Notification',
        'POST',
        '/api/v1/notifications',
        202,
        notificationData
      );

      if (notifResponse?.data) {
        this.notificationId = notifResponse.data.notification_id || notifResponse.data.id || '';
        this.log(`Notification ID: ${this.notificationId}`, 'success');
      }
    }

    // Test 10: Send Push Notification
    this.log('\n=== 6. PUSH NOTIFICATION ===', 'warning');
    if (this.userId && this.templateCode) {
      const pushData = {
        notification_type: 'push',
        user_id: this.userId,
        template_code: this.templateCode,
        variables: {
          name: 'Test User',
          link: 'https://example.com/app',
        },
        request_id: `req-${Date.now()}-${randomId}`,
        priority: 2,
        metadata: {
          campaign: 'push-test',
          source: 'railway-test',
        },
      };

      await this.test('Send Push Notification', 'POST', '/api/v1/notifications', 202, pushData);
    }

    // Test 11: Check Notification Status
    if (this.notificationId) {
      this.log('\n=== 7. NOTIFICATION STATUS ===', 'warning');
      this.log('Waiting 3 seconds for processing...', 'info');
      await new Promise((resolve) => setTimeout(resolve, 3000));

      await this.test(
        'Get Notification Status',
        'GET',
        `/api/v1/notifications/${this.notificationId}/status`,
        200
      );
    }

    // Test 12: Update User
    this.log('\n=== 8. UPDATE USER PREFERENCES ===', 'warning');
    if (this.userId) {
      const updateData = {
        push_token: `test-fcm-token-${randomId}`,
        preferences: {
          email: true,
          push: false,
        },
      };

      await this.test('Update User', 'PUT', `/api/v1/users/${this.userId}`, 200, updateData);
    }

    // Test 13: Metrics
    this.log('\n=== 9. MONITORING & METRICS ===', 'warning');
    await this.test('Get Metrics', 'GET', '/metrics', 200);

    // Test 14: Error Handling
    this.log('\n=== 10. ERROR HANDLING ===', 'warning');
    await this.test('Invalid User ID', 'GET', '/api/v1/users/invalid-uuid', 400);
    await this.test('Non-existent Endpoint', 'GET', '/api/v1/nonexistent', 404);

    const invalidNotification = {
      notification_type: 'invalid_type',
      user_id: this.userId,
    };
    await this.test(
      'Invalid Notification Type',
      'POST',
      '/api/v1/notifications',
      400,
      invalidNotification
    );

    // Test 15: Rate Limiting Test
    this.log('\n=== 11. RATE LIMITING ===', 'warning');
    this.log('Making 5 rapid requests...', 'info');
    for (let i = 1; i <= 5; i++) {
      const { response } = await this.makeRequest('GET', '/health');
      console.log(`Request ${i}/5 - Status: ${response?.status}`);
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    // Print Summary
    this.printSummary();
  }

  private printSummary() {
    this.log('\n==========================================', 'info');
    this.log('TEST SUMMARY', 'info');
    this.log('==========================================', 'info');

    const passed = this.results.filter((r) => r.passed).length;
    const failed = this.results.filter((r) => !r.passed).length;
    const total = this.results.length;

    this.log(`\nTotal Tests: ${total}`, 'info');
    this.log(`Passed: ${passed}`, 'success');
    this.log(`Failed: ${failed}`, failed > 0 ? 'error' : 'success');
    this.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`, 'info');

    if (failed > 0) {
      this.log('\nFailed Tests:', 'error');
      this.results
        .filter((r) => !r.passed)
        .forEach((r) => {
          this.log(`  - ${r.name}`, 'error');
          if (r.statusCode) {
            this.log(
              `    Expected: ${r.expectedStatus}, Got: ${r.statusCode}`,
              'error'
            );
          }
          if (r.error) {
            this.log(`    Error: ${r.error}`, 'error');
          }
        });
    }

    this.log('\n==========================================', 'info');
    this.log('Test Data:', 'info');
    this.log(`User ID: ${this.userId}`, 'info');
    this.log(`Template Code: ${this.templateCode}`, 'info');
    this.log(`Notification ID: ${this.notificationId}`, 'info');
    this.log('==========================================', 'info');
  }
}

// Run tests
const tester = new APITester();
tester.runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
