/**
 * Google Drive storage helper — service account con carpeta compartida.
 * Reemplaza a Supabase Storage para archivos generados de clases.
 *
 * ENV vars requeridos:
 * - GOOGLE_SERVICE_ACCOUNT_JSON: el JSON completo del service account (stringified)
 * - GOOGLE_DRIVE_FOLDER_ID: ID de la carpeta "EducMark-Clases" compartida con el service account
 */
import { google } from 'googleapis';
import type { drive_v3 } from 'googleapis';
import { Readable } from 'stream';

let driveClient: drive_v3.Drive | null = null;

function getDriveClient(): drive_v3.Drive {
  if (driveClient) return driveClient;

  const saJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!saJson) throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON not configured');

  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(saJson);
  } catch {
    throw new Error('GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON');
  }

  const auth = new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  driveClient = google.drive({ version: 'v3', auth });
  return driveClient;
}

/**
 * Busca o crea una subcarpeta dentro de la carpeta principal.
 * Útil para agrupar archivos por usuario: EducMark-Clases/{email}/
 */
async function getOrCreateSubfolder(parentId: string, subfolderName: string): Promise<string> {
  const drive = getDriveClient();
  const cleanName = subfolderName.replace(/['"\\]/g, '');

  // Buscar subcarpeta existente
  const searchRes = await drive.files.list({
    q: `'${parentId}' in parents and name='${cleanName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: 'files(id, name)',
    pageSize: 1,
  });

  if (searchRes.data.files && searchRes.data.files.length > 0 && searchRes.data.files[0].id) {
    return searchRes.data.files[0].id;
  }

  // Crear subcarpeta
  const createRes = await drive.files.create({
    requestBody: {
      name: cleanName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentId],
    },
    fields: 'id',
  });

  if (!createRes.data.id) throw new Error('Failed to create subfolder');
  return createRes.data.id;
}

export interface DriveUploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  directLink: string; // Link directo para usar en <img src> o descargar
}

/**
 * Sube un HTML/archivo a Google Drive y lo hace accesible públicamente.
 *
 * @param content - Contenido del archivo (string o Buffer)
 * @param fileName - Nombre del archivo (ej: "Presentacion_historia.html")
 * @param mimeType - MIME type (ej: "text/html", "image/png")
 * @param userEmail - Email del usuario dueño (se usa para subcarpeta)
 * @returns Info del archivo subido con links públicos
 */
export async function uploadToDrive(
  content: string | Buffer,
  fileName: string,
  mimeType: string,
  userEmail: string
): Promise<DriveUploadResult> {
  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!rootFolderId) throw new Error('GOOGLE_DRIVE_FOLDER_ID not configured');

  const drive = getDriveClient();

  // Subcarpeta por usuario para mantener organizado
  const userFolder = await getOrCreateSubfolder(rootFolderId, userEmail);

  // Convierte string a Buffer si es necesario
  const buffer = typeof content === 'string' ? Buffer.from(content, 'utf-8') : content;

  const uploadRes = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: [userFolder],
      mimeType,
    },
    media: {
      mimeType,
      body: Readable.from(buffer),
    },
    fields: 'id, webViewLink, webContentLink',
  });

  const fileId = uploadRes.data.id;
  if (!fileId) throw new Error('Drive upload returned no fileId');

  // Hacer el archivo accesible públicamente (cualquiera con el link)
  await drive.permissions.create({
    fileId,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  // Construye el link directo según tipo
  const directLink = mimeType.startsWith('image/')
    ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w2560` // para imágenes, usar thumbnail high-res
    : `https://drive.google.com/uc?export=view&id=${fileId}`; // para HTML/documentos

  return {
    fileId,
    webViewLink: uploadRes.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    webContentLink: uploadRes.data.webContentLink || directLink,
    directLink,
  };
}
