# Módulo Personal

Personal es el registro de empleados de cada organización. Lleva sus vacaciones, licencias, ausencias, permisos y salidas, y calcula los días según el Código de Trabajo de la República Dominicana. Está en `/personal`.

- Los administradores ven el menú **Personal**: llevan el registro completo, salarios incluidos.
- Las demás personas ven **Mis vacaciones**: su propio saldo, su calendario y su historial, si un administrador vinculó su cuenta.
- Las cuentas de clientes (portal) no ven el módulo.
- La paleta de comandos (Ctrl K) lo encuentra como «Personal y vacaciones».

## Contenido

1. [Quién ve qué](#1-quién-ve-qué)
2. [Primeros pasos](#2-primeros-pasos)
3. [Empleados](#3-empleados)
4. [Ausencias](#4-ausencias)
5. [Calendario](#5-calendario)
6. [Salidas](#6-salidas)
7. [Reglas y feriados](#7-reglas-y-feriados)
8. [Mis vacaciones](#8-mis-vacaciones)
9. [Cómo se calcula](#9-cómo-se-calcula)
10. [Mensajes de error](#10-mensajes-de-error)
11. [Referencia técnica](#11-referencia-técnica)

---

## 1. Quién ve qué

| Persona | Qué ve | Qué puede hacer |
|---|---|---|
| Administrador de la organización | Todo el registro de su organización: empleados, salarios, notas, ausencias, salidas, reglas y feriados | Todo: agregar, editar, registrar, borrar |
| Miembro con cuenta vinculada a un empleado | «Mis vacaciones»: su saldo, su calendario y su historial, sin salario, cédula, correo ni notas | Solo mirar |
| Miembro sin cuenta vinculada | «Mis vacaciones» le dice que aún no está en el registro | Nada |
| Cuenta de cliente (portal) | No ve el módulo | Nada |

Cada organización ve solo su propio registro. Un administrador de otra empresa no ve nada de la tuya.

## 2. Primeros pasos

Para un administrador que empieza a usar el módulo:

1. Abre **Personal › Reglas y feriados**. Revisa las reglas: vienen con los valores del Código de Trabajo. Agrega los feriados del año, porque no vienen cargados.
2. En **Empleados**, pulsa **Nuevo empleado** para cada persona. Pon su fecha de ingreso y, si ya llevaban el control de vacaciones antes, su [saldo inicial](#saldo-inicial-de-vacaciones).
3. Si la persona tiene cuenta en ibPulse, elígela en **Cuenta en ibPulse**. Así verá su saldo en «Mis vacaciones».
4. Registra las ausencias desde ese momento con **Registrar ausencia**.

## 3. Empleados

### Agregar o editar

**Nuevo empleado** abre el formulario. **Editar**, en la ficha de la persona, abre el mismo formulario con sus datos.

| Campo | Obligatorio | Para qué sirve |
|---|---|---|
| Nombre completo | Sí | Aparece en el registro y en el calendario |
| Cédula | No | Referencia. Solo la ven los administradores |
| Fecha de ingreso | Sí | Desde aquí se cuentan los años de servicio y las vacaciones |
| Puesto y Departamento | No | Se muestran bajo el nombre y sirven para buscar |
| Correo | No | Si coincide con el de una cuenta del equipo y aún no elegiste otra, esa cuenta se elige sola al salir del campo |
| Cuenta en ibPulse | No | Vincula a la persona con su cuenta. Lista solo cuentas del equipo que no estén vinculadas a otro empleado |
| Salario mensual y Moneda | No | Solo para estimar el monto de vacaciones pendientes al salir |
| Saldo inicial de vacaciones | No | Ver la sección siguiente |
| Notas | No | Solo las ven los administradores |

### Saldo inicial de vacaciones

**Para qué sirve.** La app calcula el saldo sumando aniversarios y restando las vacaciones registradas en ibPulse. Con alguien que ya tenía años en la empresa, la app no conoce las vacaciones que tomó antes. Sin saldo inicial cuenta todo desde el ingreso y el saldo sale inflado.

**Qué poner.**

- **Días pendientes:** los días que la persona había ganado y no había tomado en esa fecha.
- **Al día:** la fecha de ese conteo. Es el día en que tenía exactamente esos días pendientes. Lo normal es el día en que empiezas a usar el registro, o un corte como el 1 de enero.

**Qué hace la app con esa fecha.**

- Antes de la fecha no cuenta nada: todo está resumido en «Días pendientes».
- Desde la fecha suma cada aniversario nuevo (14 o 18 días) y resta las vacaciones que registres.

**Ejemplo.** Ana ingresó el 2 de marzo de 2020. Según el control de la empresa, al 1 de noviembre de 2026 tenía 6 días sin tomar.

- Pones «Días pendientes: 6» y «Al día: 01/11/2026».
- Si registras vacaciones del 7 al 11 de diciembre de 2026 (5 días laborables), le queda 1 día.
- El 2 de marzo de 2027 cumple 7 años y la app le suma 18 días sola.
- Sin saldo inicial, la app contaría 4 × 14 + 2 × 18 = 92 días desde 2020 y solo restaría lo registrado en ibPulse.

**Cuidados.**

- No incluyas el próximo aniversario en «Días pendientes»: la app lo suma sola. Si la fecha cae justo el día del aniversario, sí incluye los días de ese aniversario.
- Registra solo las vacaciones desde esa fecha. Las anteriores no restan del saldo.
- Si tomó días por adelantado, pon un número negativo.
- Con un empleado nuevo, o si vas a registrar todas sus vacaciones desde el ingreso, deja los dos campos vacíos.
- La fecha no puede ser anterior al ingreso. Si pones días, la fecha es obligatoria.

### El registro

La pestaña **Empleados** lista a todo el equipo en el **Registro de personal**.

- **Activos, De baja, Todos:** filtran por quien sigue en la empresa o ya salió. Cada opción muestra cuántas personas tiene.
- **Buscar:** por nombre, puesto, departamento, correo o cédula.
- **Columnas:**
  - **Empleado:** nombre, con puesto y departamento debajo.
  - **Ingreso:** fecha y antigüedad, o la fecha de salida de quien salió.
  - **Por año:** los días que suma su próximo aniversario.
  - **Hoy:** «Trabajando», la ausencia de hoy o el sello «De baja».
  - **Disponibles:** sus días de vacaciones. En «De baja» la columna se llama **Pendiente al salir** y muestra lo que se le debía en su salida.
- **Total:** la última fila suma la columna. En «Todos» no hay total, porque no se suman días disponibles con días pendientes de salida.
- Un saldo negativo sale en rojo: la persona tomó más días de los que tenía ganados.

### La ficha

Al pulsar a una persona se abre su ficha:

- **Datos:** ingreso y antigüedad, salario, cédula, correo y cuenta vinculada. Los botones **Editar**, **Registrar salida** y **Eliminar** están arriba.
- **Vacaciones al día de hoy:**
  - **Disponibles:** ganadas menos tomadas, ya descontando las programadas.
  - **Ganadas:** incluye el saldo inicial.
  - **Tomadas:** días laborables.
  - **Próximo aniversario:** su fecha y los días que suma.
- **Salida:** solo si la persona salió (ver [Salidas](#6-salidas)).
- **Historial:** todas sus ausencias, de la más reciente a la más antigua, con el resumen del año en curso. Pulsa una fila para editarla.

### Eliminar o registrar salida

**Eliminar** borra a la persona y todas sus ausencias, y no se puede deshacer. Úsalo solo para corregir un registro hecho por error. Si la persona dejó la empresa, usa **Registrar salida**: conserva su historial y calcula lo que se le debe.

## 4. Ausencias

### Tipos

| Tipo | Subtipos | Cómo cuenta |
|---|---|---|
| Vacaciones | Ninguno | Resta del saldo de vacaciones. Siempre con disfrute de salario |
| Licencia | Médica, Maternidad, Paternidad, Matrimonio, Duelo, Estudios, Otra | No resta del saldo. Con o sin disfrute de salario |
| Ausencia | Justificada, Injustificada | No resta del saldo. Una injustificada se marca sin disfrute de salario; puedes cambiarlo |
| Permiso | Días completos o **Por horas** (un solo día) | No resta del saldo. Con o sin disfrute de salario |

Para algunas licencias el formulario recuerda lo que da el Código de Trabajo (art. 54). No lo impone:

- **Paternidad:** 2 días, por el nacimiento de un hijo.
- **Matrimonio:** 5 días.
- **Duelo:** 3 días, por la muerte de abuelos, padres, hijos, cónyuge o pareja.

Si la licencia pasa de esos días, el formulario avisa para que confirmes que fue acordado; no impide guardar. Las demás licencias toman la duración que indique el certificado o el acuerdo.

### Registrar, editar y borrar

Se abre el formulario **Registrar ausencia** desde:

- el botón **Registrar ausencia**, arriba a la derecha;
- el número de un día en el calendario, que deja puesta esa fecha;
- **Registrar ausencia** en la ficha de la persona, que deja puesta a esa persona.

Mientras llenas las fechas, el formulario muestra cuántos días laborables toma. En vacaciones, muestra también cuántos días le quedan a la persona. Se puede dejar el saldo en negativo (vacaciones adelantadas), y el formulario lo avisa en rojo.

Para editar, pulsa la ausencia en el calendario, en «Fuera hoy», en «Próximos 30 días» o en el historial de la persona. El mismo formulario tiene el botón **Borrar**. La persona de una ausencia ya registrada no se cambia; bórrala y regístrala de nuevo.

La **Nota** solo la ven los administradores.

### Lo que no se permite

- Una ausencia que empiece antes del ingreso o que termine después de la salida.
- Dos ausencias de la misma persona que se crucen. Solo dos permisos por horas pueden compartir un día.
- Un permiso por horas de más de un día, o de más de 24 horas.

## 5. Calendario

La pestaña **Calendario** muestra el mes de todo el equipo.

- Cada ausencia es una etiqueta con el color de la persona (el mismo de su avatar en toda la app) y el icono del tipo. Los permisos por horas muestran las horas.
- Los días libres y los feriados se ven sombreados. El feriado muestra su nombre.
- Caben tres etiquetas por día; el resto se indica como «+N más».
- Arriba se filtra por tipo (Vacaciones, Licencias, Ausencias, Permisos) y por persona («Todo el equipo» o alguien en concreto, incluidas las personas de baja).
- En el teléfono el mes se muestra como lista, con los feriados en su fecha.

A la derecha:

- **Fuera hoy:** quién falta hoy y hasta cuándo.
- **Próximos 30 días:** ausencias que empiezan pronto (hasta 10; el resto está en el calendario).
- **Aniversarios:** quién cumple años de servicio en los próximos 60 días y cuántos días suma.

## 6. Salidas

### Registrar una salida

En la ficha, **Registrar salida** pide:

- **Último día de trabajo.**
- **Tipo de salida:**

| Tipo | Significado |
|---|---|
| Despido | La empresa termina el contrato por una falta del empleado |
| Desahucio | Una de las partes termina el contrato con preaviso, sin alegar causa |
| Dimisión | El empleado termina el contrato por una falta de la empresa |
| Renuncia | El empleado se va por decisión propia |
| Mutuo acuerdo | Las dos partes acuerdan terminar |
| Fin de contrato | Termina el plazo o la obra del contrato |
| Otro motivo | Fallecimiento, jubilación u otra causa |

- **Motivo:** texto libre.

Si la persona tiene ausencias después de esa fecha, el formulario las lista y no deja guardar. Hay que borrarlas o elegir otra fecha.

### Lo que se calcula

El formulario y la ficha muestran **Vacaciones pendientes al salir**:

- **Ganadas y no tomadas:** el saldo al último día de trabajo.
- **Proporcional del año en curso:** lo que suman los meses cumplidos desde el último aniversario (ver [Proporcional](#proporcional)).
- **Total pendiente:** la suma de las dos.
- **Monto estimado:** solo si la persona tiene salario. Es el total pendiente por el salario diario (salario mensual ÷ 23.83).

El monto es solo de vacaciones. No incluye preaviso, cesantía, salario de Navidad ni descuentos. Confírmalo con tu contador o con la calculadora del Ministerio de Trabajo.

Después de la salida, la persona queda **De baja**: no suma más aniversarios y su saldo queda fijo en el último día de trabajo.

### Quitar una salida

**Editar salida › Quitar salida** devuelve a la persona a activa. Su saldo vuelve a sumar.

## 7. Reglas y feriados

### Reglas de vacaciones

| Regla | Valor de ley | Qué controla |
|---|---|---|
| Días por año | 14 | Días laborables que suma cada aniversario (art. 177) |
| A partir del año | 5 | Desde qué año de servicio se usa el número siguiente |
| Días por año desde entonces | 18 | Días que suma cada aniversario desde ese año (art. 177) |
| Proporcional desde | 5 meses | Meses de un año sin cumplir que empiezan a sumar (art. 180) |
| Días laborables | lunes a viernes | Los únicos días que cuentan en vacaciones y licencias. Agrega el sábado si tu empresa lo trabaja |
| Divisor del salario diario | 23.83 | Salario mensual ÷ este número = salario diario, para el monto de salida |

- **Valores de ley** vuelve a poner los valores de ley en el formulario. Hay que pulsar **Guardar reglas** para aplicarlos.
- Las reglas valen para todo el registro y también hacia atrás. Si cambias 14 por 15, todos los saldos se recalculan con 15.
- Una organización que nunca guardó reglas usa los valores de ley.

### Feriados

- Se agregan por año con su fecha y su nombre, y se quitan con la X. Las flechas cambian de año.
- Pon la fecha en que se disfruta el feriado. Si la ley lo traslada a un lunes, pon el lunes.
- Hay un feriado por día como máximo.
- Ningún feriado viene cargado: así ninguna fecha sale equivocada.
- Un feriado no cuenta como día laborable en vacaciones ni licencias.

## 8. Mis vacaciones

Lo ve cualquier persona del equipo que no sea administradora, en el menú **Mis vacaciones**:

- su saldo: disponibles, ganadas, tomadas y próximo aniversario;
- el calendario del mes con sus ausencias y los feriados;
- **Próximas:** sus ausencias en curso y programadas;
- **En [año en curso]:** los días de cada tipo en el año;
- su historial completo.

No ve su salario, su cédula, su correo ni las notas de los administradores, y no puede cambiar nada. Si su cuenta no está vinculada, ve el mensaje «Aún no estás en el registro de personal».

## 9. Cómo se calcula

El cálculo está en `src/utils/leave.ts`. Toda la app usa las mismas funciones, así que los números coinciden en todas las vistas.

### Días laborables

Un día es laborable si su día de la semana está en **Días laborables** y no es feriado. Las ausencias de días completos cuentan solo días laborables. Los permisos por horas cuentan horas, no días.

### Años de servicio

Un año de servicio se completa al final del día anterior a su aniversario. Ejemplo: quien ingresó el 2 de marzo de 2025 completa su primer año al final del 1 de marzo de 2026.

Cada aniversario suma los días de ese año de servicio:

- años 1 a 4: 14 días;
- desde el año 5: 18 días (el quinto aniversario ya suma 18).

### Saldo de vacaciones

```
Disponibles = saldo inicial
            + días de los aniversarios cumplidos después del día del saldo inicial
            - vacaciones tomadas desde el día del saldo inicial
            - vacaciones programadas (fechas futuras)
```

Sin saldo inicial, el saldo empieza en cero el día de ingreso. Las vacaciones programadas ya se descuentan de «Disponibles». La ficha las cuenta aparte.

### Proporcional

Para el año de servicio que todavía no se cumple, la app cuenta los meses completos desde el último aniversario, o desde el ingreso si aún no cumple un año. Desde 5 meses suma, con la escala del art. 180:

| Meses | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|
| Días (año de 14 días) | 6 | 7 | 8 | 9 | 10 | 11 | 12 |

En general: `(meses + 1) × días de ese año ÷ 14`. Con un año de 18 días, 7 meses suman 8 × 18 ÷ 14 = 10.29 días. El proporcional solo se usa al calcular una salida.

### Salida y monto

```
Total pendiente = disponibles al último día de trabajo + proporcional
Salario diario  = salario mensual ÷ divisor (23.83)
Monto estimado  = total pendiente × salario diario   (nunca menos de cero)
```

### Ejemplos

Cada caso se comprobó contra el código. Ninguno tiene feriados cargados.

| Caso | Resultado |
|---|---|
| Vacaciones del lunes 2 al viernes 6 de marzo de 2026 | 5 días laborables |
| Lo mismo con un feriado el miércoles 4 | 4 días |
| Del viernes 6 al lunes 9 de marzo de 2026 | 2 días; 3 si el sábado es laborable |
| Ingreso 2 mar 2020, saldo al 17 nov 2026, sin saldo inicial, con 5 días tomados en marzo | Ganadas 92 (4 × 14 + 2 × 18); disponibles 87 |
| Ingreso 2 jun 2025, salida 31 oct 2025 (4 meses) | 0 días |
| Ingreso 2 jun 2025, salida 1 nov 2025 (5 meses), salario RD$50,000 | 6 días; salario diario RD$2,098.20; monto RD$12,589.17 |
| Ingreso 2 jun 2025, salida 1 abr 2026 (10 meses) | 11 días |
| Ingreso 2 jun 2025, salida 1 jun 2026 (un año exacto) | 14 días |
| Ingreso 2 mar 2020, salida 30 oct 2026, con 5 días tomados en marzo | 87 disponibles + 10.29 proporcional (7 meses de un año de 18) = 97.29 días |
| Ingreso 2 jun 2025, vacaciones adelantadas del 1 al 14 jul 2025 (10 días), salida 1 nov 2025 | −10 + 6 = −4 días; monto RD$0.00 |

### Interpretaciones por confirmar

Estas decisiones son interpretaciones. El dueño o un contador debe confirmarlas antes de usar los montos en una liquidación:

- **Proporcional después del primer año.** La escala del art. 180 se aplica también a la parte del año en curso de quien ya cumplió años de servicio, escalada por los días de ese año ÷ 14.
- **Divisor 23.83.** Es el factor usual en la República Dominicana; se puede cambiar en las reglas.
- **Salario.** El monto usa el salario mensual registrado, no un promedio de los últimos meses.
- **Maternidad.** Su duración no se impone; se registra la que indique el certificado.

## 10. Mensajes de error

| Mensaje | Qué pasó | Qué hacer |
|---|---|---|
| La ausencia cae fuera del empleo: antes del ingreso o después de la salida. | Las fechas no están dentro del empleo | Corrige las fechas, o la fecha de ingreso o de salida |
| Se cruza con otra ausencia de esa persona. Cambia las fechas o edita la otra. | Ya hay una ausencia esos días | Ajusta una de las dos |
| Un permiso por horas es de un solo día. | Permiso por horas con dos fechas | Usa una sola fecha, o quita «Por horas» |
| Esa cuenta ya está vinculada a otra persona del registro. | Cada cuenta va con un solo empleado | Desvincúlala del otro empleado primero |
| La salida no puede ser antes del ingreso. | Fecha de salida anterior al ingreso | Corrige la fecha |
| El día del saldo inicial no puede ser antes del ingreso. | «Al día» es anterior al ingreso | Corrige la fecha |
| Ya hay un feriado ese día. | Un feriado por día | Edita el existente o elige otra fecha |
| Solo los administradores del equipo cambian el registro de personal, y solo con cuentas del equipo. | La cuenta no es administradora, o la cuenta vinculada es de otra organización | Pide el cambio a un administrador |
| El registro de personal aún no está activado. Falta aplicar su actualización en la base de datos. | La migración no está aplicada | Ver [Activarlo](#activarlo) |

## 11. Referencia técnica

### Archivos

| Archivo | Contenido |
|---|---|
| `supabase/migrations/20261117120000_staff_leave.sql` | Tablas, reglas de acceso, guardas y la función `my_leave_record()` |
| `supabase/rollback/20261117120000_staff_leave_rollback.sql` | Cierra el acceso y conserva los datos |
| `src/pages/StaffPage.tsx` | Página `/personal`: el registro para administradores, «Mis vacaciones» para los demás |
| `src/components/staff/` | Calendario, formularios (empleado, ausencia, salida), ficha, registro, reglas, «Mis vacaciones» y textos (`labels.ts`) |
| `src/services/staffService.ts` | Lectura y escritura en Supabase |
| `src/types/Staff.ts` | Tipos del módulo |
| `src/utils/leave.ts` | Cálculo: días laborables, años de servicio, saldo, proporcional, salida y totales |
| `src/utils/errors.ts` | Mensajes de la base de datos traducidos al español |

También tocan el módulo:

- `src/router/index.tsx` (la ruta);
- `src/components/layout/Sidebar.tsx` (entrada del menú);
- `src/components/layout/CommandPalette.tsx` (búsqueda);
- `src/components/ui/StatusBadge.tsx` (sello «De baja»);
- `src/utils/format.ts` (`hueFor`, el color de cada persona).

### Tablas

Todas tienen `organization_id`. Su valor por defecto es `my_org_id()`, la organización de quien escribe.

**`hr_settings`**: una fila por organización, creada al guardar las reglas por primera vez.

| Columna | Por defecto | Límites |
|---|---|---|
| `vacation_days` | 14 | 1 a 60 |
| `vacation_days_senior` | 18 | 1 a 60 |
| `senior_after_years` | 5 | 1 a 50 |
| `proportional_from_months` | 5 | 1 a 11 |
| `work_days` | `{1,2,3,4,5}` | 0 es domingo, 6 es sábado |
| `daily_salary_divisor` | 23.83 | 1 a 31 |

**`hr_holidays`**: `date` y `name`. Restricción `hr_holidays_one_per_day` (un feriado por día y organización).

**`employees`**:

- `full_name` y `hire_date` (obligatorios);
- `national_id`, `position`, `department`, `email`;
- `user_id` (cuenta vinculada);
- `monthly_salary`, `currency` (tres letras, `DOP` por defecto);
- `vacation_opening_days`, `vacation_opening_date`;
- `exit_date`, `exit_type`, `exit_reason`, `notes`.

Restricciones:

- `employees_one_per_account`: una cuenta, un empleado por organización.
- `employees_exit_complete`: fecha y tipo de salida van juntos.
- `employees_exit_after_hire`: la salida no va antes del ingreso.
- `employees_opening_after_hire`: el saldo inicial no va antes del ingreso.
- `employees_id_organization`: une cada ausencia con su organización.

`exit_type` acepta `despido`, `desahucio`, `dimision`, `renuncia`, `mutuo_acuerdo`, `fin_contrato` y `otro`.

**`employee_absences`**:

- `employee_id`, `kind` (`vacaciones`, `licencia`, `ausencia`, `permiso`) y `leave_type`;
- `start_date`, `end_date`, `hours`, `paid`, `note`.

Restricciones:

- `employee_absences_employee_fkey` apunta a `(employee_id, organization_id)`: una ausencia solo puede ser de un empleado de su misma organización. Borrar al empleado borra sus ausencias.
- `employee_absences_dates`: la fecha final no va antes de la inicial.
- `employee_absences_hours_one_day`: las horas solo valen en un permiso de un día.
- `employee_absences_leave_type`: los subtipos de licencia y de ausencia son obligatorios; vacaciones y permisos no llevan subtipo.

### Acceso (RLS)

- **Administradores de la organización:** `organization_id = my_org_id()` y `is_tenant_admin()`. Leen y escriben `employees` y `employee_absences`, y escriben `hr_settings` y `hr_holidays`. Al vincular una cuenta, esta debe ser de la misma organización (`is_colleague(user_id)`).
- **Miembros de la organización:** leen `hr_settings` y `hr_holidays`.
- **Visitantes sin sesión (`anon`):** sin permisos sobre las cuatro tablas.

Un administrador necesita el correo confirmado: sin él, `my_org_id()` es nulo y no ve el registro.

`my_leave_record()` es una función `SECURITY DEFINER`. Devuelve el registro propio de quien la llama, en `jsonb`:

- `employee`: id, nombre, puesto, departamento, ingreso, salida y saldo inicial;
- `absences`: sus ausencias, sin la nota.

Devuelve `NULL` si la cuenta no está vinculada.

### Guardas en la base

`guard_employee_absence` (antes de insertar o cambiar una ausencia):

- código `23514`, «The absence falls outside the employment dates»: la ausencia cae antes del ingreso o después de la salida;
- código `23P01`, «The absence overlaps another absence of the same employee»: se cruza con otra ausencia, salvo dos permisos por horas el mismo día.

`hr_set_updated_at` actualiza `updated_at` en `hr_settings` y `employees`.

### Activarlo

Requiere `20261105123000_organizations.sql` aplicada. Si falta, la migración se detiene sin cambiar nada.

1. Haz un backup de la base (`backup.sh`).
2. En el SQL Editor de Supabase, pega el archivo `supabase/migrations/20261117120000_staff_leave.sql` completo y ejecútalo. Se puede ejecutar de nuevo sin efectos.
3. Comprueba que esta consulta devuelva 7:

   ```sql
   select count(*) from pg_policies
   where tablename in ('hr_settings', 'hr_holidays', 'employees', 'employee_absences');
   ```

4. Publica el frontend después de aplicar el SQL. Si el frontend llega antes, `/personal` muestra «El registro de personal aún no está activado».

### Revertirlo

`supabase/rollback/20261117120000_staff_leave_rollback.sql` quita las reglas de acceso, los permisos, las guardas y `my_leave_record()`. Las tablas y sus datos quedan intactos y nadie las lee desde la app. Ejecutar la migración otra vez restaura el acceso. Para borrar también los datos, después de un backup:

```sql
DROP TABLE public.employee_absences, public.employees, public.hr_holidays, public.hr_settings;
```

### Pruebas

El repositorio no tiene un framework de pruebas. Al construir el módulo se probó fuera del repositorio:

- el cálculo, con 44 casos (los de [Ejemplos](#ejemplos) entre ellos);
- la migración, con 103 comprobaciones sobre una copia restaurada de producción. Cubren aislamiento entre organizaciones, administrador, miembro y visitante sin sesión, guardas, rollback y reaplicación.

### Límites actuales

- Los empleados no piden vacaciones desde la app: las registran los administradores.
- No hay medios días. Un permiso por horas es de un solo día.
- No se adjuntan certificados.
- Las reglas valen para todo el registro y hacia atrás.
- Los feriados se cargan a mano cada año.
- El monto de salida es solo de vacaciones.
- No hay exportación ni avisos.
