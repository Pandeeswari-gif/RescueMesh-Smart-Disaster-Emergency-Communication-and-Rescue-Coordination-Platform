/**
 * RescueMesh AI-Assisted Intelligent Severity Scoring Engine
 *
 * Transparent, explainable rule-based priority matrix (0-100).
 * Calculates emergency severity dynamically based on situational factors,
 * vulnerability flags, flood surge levels, and victim triage needs.
 *
 * Priority Classification:
 * - 0–30:   LOW
 * - 31–60:  MEDIUM
 * - 61–80:  HIGH
 * - 81–100: CRITICAL
 */

function calculatePriorityScore(data = {}) {
  let score = 0;
  const breakdown = [];

  // 1. Base Severity Contribution (Max: 35)
  const severity = (data.severity || 'MEDIUM').toUpperCase();
  let severityPoints = 15;
  if (severity === 'CRITICAL') severityPoints = 35;
  else if (severity === 'HIGH') severityPoints = 25;
  else if (severity === 'MEDIUM') severityPoints = 15;
  else if (severity === 'LOW') severityPoints = 5;

  score += severityPoints;
  breakdown.push({
    factor: 'Declared Severity Level',
    points: severityPoints,
    reason: `Initial triage severity marked as ${severity}`
  });

  // 2. Number of Affected People / Victims (Max: 20)
  const victims = parseInt(data.affectedCount, 10) || 1;
  let victimPoints = 5;
  if (victims > 10) {
    victimPoints = 20;
    breakdown.push({
      factor: 'High Victim Count',
      points: 20,
      reason: `Large group of ${victims} people stranded, mass evacuation priority`
    });
  } else if (victims >= 5) {
    victimPoints = 15;
    breakdown.push({
      factor: 'Significant Victim Group',
      points: 15,
      reason: `Group of ${victims} individuals requiring extraction`
    });
  } else if (victims >= 2) {
    victimPoints = 10;
    breakdown.push({
      factor: 'Multiple Victims',
      points: 10,
      reason: `${victims} individuals affected at this location`
    });
  } else {
    victimPoints = 5;
    breakdown.push({
      factor: 'Single Victim',
      points: 5,
      reason: 'Single stranded individual report'
    });
  }
  score += victimPoints;

  // 3. Life-threatening Injury Condition (Max: 20)
  if (data.hasInjuries === true || data.hasInjuries === 'true') {
    const injuryPoints = 20;
    score += injuryPoints;
    breakdown.push({
      factor: 'Medical Emergency / Severe Injuries',
      points: injuryPoints,
      reason: 'Life-threatening medical condition reported requiring immediate paramedic response'
    });
  }

  // 4. Flood Water Surge Level (Max: 15)
  const waterLevel = parseFloat(data.floodWaterLevel) || 0.0;
  if (waterLevel >= 2.0) {
    score += 15;
    breakdown.push({
      factor: 'Extreme Water Depth',
      points: 15,
      reason: `Water level at ${waterLevel}m exceeds ceiling/safety height; boat/amphibious dispatch urgent`
    });
  } else if (waterLevel >= 1.0) {
    score += 10;
    breakdown.push({
      factor: 'Moderate Water Surge',
      points: 10,
      reason: `Water level at ${waterLevel}m prevents standard foot or light vehicle evacuation`
    });
  } else if (waterLevel > 0.2) {
    score += 5;
    breakdown.push({
      factor: 'Shallow Flood Inundation',
      points: 5,
      reason: `Water level at ${waterLevel}m threatens ground floor safety`
    });
  }

  // 5. Vulnerability Indicators (Max: 15)
  const vuln = data.vulnerability || {};
  let vulnPoints = 0;
  const vulnerableGroups = [];

  if (vuln.hasInfants || vuln.hasInfants === 'true') {
    vulnPoints += 5;
    vulnerableGroups.push('Infants / Children');
  }
  if (vuln.hasElderly || vuln.hasElderly === 'true') {
    vulnPoints += 5;
    vulnerableGroups.push('Senior Citizens');
  }
  if (vuln.hasDisabled || vuln.hasDisabled === 'true') {
    vulnPoints += 5;
    vulnerableGroups.push('Persons with Disabilities');
  }
  if (vuln.hasPregnant || vuln.hasPregnant === 'true') {
    vulnPoints += 5;
    vulnerableGroups.push('Pregnant Women');
  }

  // Cap vulnerability at 15 points
  vulnPoints = Math.min(15, vulnPoints);
  if (vulnPoints > 0) {
    score += vulnPoints;
    breakdown.push({
      factor: 'High Vulnerability Demographics',
      points: vulnPoints,
      reason: `Presence of vulnerable demographics: ${vulnerableGroups.join(', ')}`
    });
  }

  // 6. Elapsed Time Waiting Penalty (Max: 10)
  if (data.createdAt) {
    const elapsedMinutes = Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60));
    if (elapsedMinutes > 60) {
      score += 10;
      breakdown.push({
        factor: 'Extended Response Latency',
        points: 10,
        reason: `Pending rescue response time exceeded 60 minutes (${elapsedMinutes}m elapsed)`
      });
    } else if (elapsedMinutes > 30) {
      score += 5;
      breakdown.push({
        factor: 'Response Latency Escalation',
        points: 5,
        reason: `Pending rescue response time exceeded 30 minutes (${elapsedMinutes}m elapsed)`
      });
    }
  }

  // Cap final score strictly to [0, 100]
  score = Math.min(100, Math.max(0, score));

  // Determine Level
  let priorityLevel = 'LOW';
  if (score >= 81) priorityLevel = 'CRITICAL';
  else if (score >= 61) priorityLevel = 'HIGH';
  else if (score >= 31) priorityLevel = 'MEDIUM';
  else priorityLevel = 'LOW';

  return {
    score,
    priorityLevel,
    breakdown,
    engineTitle: 'AI-Assisted Intelligent Severity Scoring',
    calculatedAt: new Date().toISOString()
  };
}

module.exports = {
  calculatePriorityScore
};
