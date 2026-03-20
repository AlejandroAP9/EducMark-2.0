'use client';

import React from 'react';
import { Modal, Button } from '@/shared/components/ui/UIComponents';

interface LegalModalsProps {
  activeModal: 'terms' | 'privacy' | null;
  onClose: () => void;
}

export const LegalModals: React.FC<LegalModalsProps> = ({ activeModal, onClose }) => {
  return (
    <>
      <Modal isOpen={activeModal === 'terms'} onClose={onClose} title="Terminos y Condiciones">
        <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
          <div>
            <p className="mb-2 font-semibold">Ultima actualizacion: Diciembre 2025</p>
            <p>Bienvenido a EducMark. Al utilizar nuestra plataforma, aceptas cumplir con los siguientes terminos y condiciones. Estos terminos rigen la relacion entre tu (el &quot;Usuario&quot;) y EducMark (representada por Alejandro Alvarez P.).</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">1. Descripcion del Servicio</h4>
            <p>EducMark es una plataforma SaaS impulsada por Inteligencia Artificial que ayuda a docentes a generar planificaciones, presentaciones y evaluaciones alineadas al curriculum chileno.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">2. Propiedad Intelectual</h4>
            <p className="mb-2"><strong>Del Software:</strong> Todo el codigo, diseno y algoritmos de la plataforma son propiedad exclusiva de EducMark.</p>
            <p><strong>Del Contenido Generado:</strong> El material educativo generado (clases, PPTs, evaluaciones) es de propiedad conjunta. El Usuario tiene derechos ilimitados para usarlo en sus clases. EducMark se reserva el derecho de almacenar este contenido en su base de datos para entrenar modelos y mejorar el servicio para la comunidad de profesores.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">3. Uso Aceptable y Restricciones</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>La cuenta es personal e intransferible. Esta prohibido compartir credenciales.</li>
              <li>Prohibida la reventa de las cuentas o del servicio de generacion a terceros.</li>
              <li>Prohibido el uso de bots, scrapers o sistemas automatizados para extraer contenido.</li>
              <li>El usuario es responsable de revisar el contenido generado antes de aplicarlo en el aula.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">4. Pagos y Reembolsos</h4>
            <p>Los pagos se procesan de forma segura a traves de Mercado Pago. Ofrecemos una <strong>Garantia de Satisfaccion de 7 dias</strong>. Si no estas conforme, puedes solicitar la devolucion total de tu dinero escribiendo a <a href="mailto:alejandro@educmark.cl" className="text-primary hover:underline">alejandro@educmark.cl</a>. No haremos preguntas dificiles, aunque agradeceremos tu feedback para mejorar.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">5. Modificaciones</h4>
            <p>Nos reservamos el derecho de modificar estos terminos en cualquier momento. Los cambios sustanciales seran notificados via email.</p>
          </div>

          <div className="pt-4 border-t border-white/10">
            <p><strong>Contacto Legal:</strong> <a href="mailto:alejandro@educmark.cl" className="text-primary hover:underline">alejandro@educmark.cl</a></p>
          </div>

          <div className="pt-4 flex justify-end sticky bottom-0 bg-[#1a1a2e] pb-2 border-t border-white/10">
            <Button onClick={onClose} className="px-8">Cerrar</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === 'privacy'} onClose={onClose} title="Politica de Privacidad">
        <div className="space-y-6 text-gray-300 text-sm leading-relaxed max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar text-left">
          <p>En EducMark, nos tomamos muy en serio la privacidad de tus datos. Esta politica describe como recopilamos, usamos y protegemos tu informacion.</p>

          <div>
            <h4 className="font-bold text-white mb-2">1. Informacion que Recopilamos</h4>
            <p className="mb-2">Para el funcionamiento del servicio, unicamente recopilamos:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre completo.</li>
              <li>Direccion de correo electronico.</li>
              <li>Datos de uso de la plataforma (generaciones realizadas, preferencias).</li>
            </ul>
            <p className="mt-2 text-xs italic">No almacenamos datos bancarios ni de tarjetas de credito; estos son procesados directamente por Mercado Pago.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">2. Uso de la Informacion</h4>
            <p className="mb-2">Tus datos se utilizan para:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Proporcionar el servicio y acceso a tu cuenta.</li>
              <li>Enviarte notificaciones importantes (recuperacion de contrasena, actualizaciones).</li>
              <li>Mejorar la precision de nuestra Inteligencia Artificial.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">3. Compartir Informacion con Terceros</h4>
            <p className="mb-2">Utilizamos servicios de terceros confiables para operar:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase:</strong> Para autenticacion y base de datos segura.</li>
              <li><strong>Mercado Pago:</strong> Para procesamiento de pagos.</li>
              <li><strong>n8n:</strong> Para automatizacion de flujos de trabajo internos.</li>
            </ul>
            <p className="mt-2 font-semibold">Nunca venderemos tus datos personales a terceros.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">4. Seguridad</h4>
            <p>Implementamos medidas de seguridad estandar de la industria, incluyendo encriptacion SSL en transito y cifrado en reposo para proteger tu informacion contra accesos no autorizados.</p>
          </div>

          <div>
            <h4 className="font-bold text-white mb-2">5. Tus Derechos (ARCO)</h4>
            <p>Puedes solicitar el acceso, rectificacion, cancelacion u oposicion al tratamiento de tus datos escribiendo directamente a <a href="mailto:alejandro@educmark.cl" className="text-primary hover:underline">alejandro@educmark.cl</a>.</p>
          </div>

          <div className="pt-4 flex justify-end sticky bottom-0 bg-[#1a1a2e] pb-2 border-t border-white/10">
            <Button onClick={onClose} className="px-8">Cerrar</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
