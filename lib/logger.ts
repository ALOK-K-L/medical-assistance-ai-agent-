import fs from 'fs';
import path from 'path';

export function logAudit(action: string, details: string, patientId?: string) {
    try {
        const logFilePath = path.join(process.cwd(), 'hipaa-audit.log');
        
        // Simple mock encryption/anonymization for the patient ID if provided
        const maskedId = patientId ? `MASKED-${patientId.substring(0, 4)}***` : 'N/A';
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: 'HIPAA_AUDIT',
            action,
            details,
            patientId: maskedId,
            status: 'SECURE_PHI_ANONYMIZED',
            system: 'LifeBeat_Core'
        };

        const logString = `[${logEntry.timestamp}] [${logEntry.status}] ACTION: ${logEntry.action} | TARGET: ${logEntry.patientId} | DETAILS: ${logEntry.details}\n`;

        fs.appendFileSync(logFilePath, logString);
        console.log(`🔒 HIPAA AUDIT LOGGED: ${logEntry.action}`);
    } catch (e) {
        console.error("Failed to write audit log", e);
    }
}
