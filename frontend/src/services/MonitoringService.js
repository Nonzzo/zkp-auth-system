class MonitoringService {
  constructor() {
    this.prometheusUrl = 'http://localhost:9090/api/v1';
    this.queryTimeout = 30000; // 30s
  }

  /**
   * Query Prometheus metrics
   */
  async queryMetric(query) {
    try {
      const response = await fetch(
        `${this.prometheusUrl}/query?query=${encodeURIComponent(query)}`,
        { timeout: this.queryTimeout }
      );
      
      if (!response.ok) {
        throw new Error(`Prometheus query failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.result;
    } catch (error) {
      console.error('Monitoring service error:', error);
      throw error;
    }
  }

  /**
   * Get proof generation latency (p95)
   */
  async getProofGenerationLatency() {
    const query = 'histogram_quantile(0.95, rate(zkp_proof_generation_seconds_bucket[5m]))';
    const results = await this.queryMetric(query);
    return results[0]?.value[1] || 0;
  }

  /**
   * Get authentication success rate
   */
  async getAuthSuccessRate() {
    const query = 'rate(zkp_auth_attempts_total{result="success"}[5m]) / (rate(zkp_auth_attempts_total[5m]) + 0.0001)';
    const results = await this.queryMetric(query);
    return results[0]?.value[1] || 0;
  }

  /**
   * Get total users registered
   */
  async getTotalUsersRegistered() {
    const results = await this.queryMetric('zkp_users_registered_total');
    return parseInt(results[0]?.value[1] || 0);
  }

  /**
   * Get active verifications count
   */
  async getActiveVerifications() {
    const results = await this.queryMetric('zkp_active_verifications');
    return parseInt(results[0]?.value[1] || 0);
  }

  /**
   * Get proof verification results
   */
  async getProofVerificationResults() {
    const results = await this.queryMetric('rate(zkp_proof_verified_total[5m])');
    return results.map(r => ({
      result: r.metric.result,
      rate: parseFloat(r.value[1])
    }));
  }

  /**
   * Get all ZKP metrics at once
   */
  async getAllMetrics() {
    const [
      proofLatency,
      authSuccessRate,
      totalUsers,
      activeVerifications,
      verificationResults
    ] = await Promise.all([
      this.getProofGenerationLatency(),
      this.getAuthSuccessRate(),
      this.getTotalUsersRegistered(),
      this.getActiveVerifications(),
      this.getProofVerificationResults()
    ]);

    return {
      proofLatency: parseFloat(proofLatency),
      authSuccessRate: parseFloat(authSuccessRate),
      totalUsers,
      activeVerifications,
      verificationResults
    };
  }
}

export default new MonitoringService();