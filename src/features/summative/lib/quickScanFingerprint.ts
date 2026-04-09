import type { CorrectAnswers } from '../types/omrScanner';

/**
 * Genera una huella determinista de una pauta de respuestas (`answer_key`).
 *
 * Uso: agrupar escaneos QuickScan que comparten exactamente la misma pauta
 * de correccion como "un curso rendido", aunque cada uno tenga `evaluation_id = null`.
 *
 * Formato: `tf:<N>:VVFVF...|mc:<M>:ABCDA...`
 *
 * - Longitud conocida por seccion (`N`, `M`).
 * - Respuestas en orden sin separadores por item (ahorra chars).
 * - Null/undefined se serializa como `_` para preservar posiciones.
 * - Determinista: misma entrada siempre da el mismo output, sin hashing
 *   (para poder debuggear facilmente y comparar en la UI).
 */
export function answerKeyFingerprint(key: CorrectAnswers | null | undefined): string {
    if (!key) return 'empty';
    const tfArr = Array.isArray(key.tf) ? key.tf : [];
    const mcArr = Array.isArray(key.mc) ? key.mc : [];
    const tfStr = tfArr.map((v) => (v || '_').toString().toUpperCase()).join('');
    const mcStr = mcArr.map((v) => (v || '_').toString().toUpperCase()).join('');
    return `tf:${tfArr.length}:${tfStr}|mc:${mcArr.length}:${mcStr}`;
}

/**
 * Chequea si dos answer_keys son iguales (por contenido, no por referencia).
 */
export function sameAnswerKey(
    a: CorrectAnswers | null | undefined,
    b: CorrectAnswers | null | undefined
): boolean {
    return answerKeyFingerprint(a) === answerKeyFingerprint(b);
}
