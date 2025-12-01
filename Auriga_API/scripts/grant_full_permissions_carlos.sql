-- Script para asignar permisos completos a carlos.rodriguez
-- Esto le dará acceso a todas las factories, departamentos y roles administrativos

-- Obtener el ID del empleado
DO $$
DECLARE
    employee_id_var BIGINT;
    ts_now TIMESTAMP WITH TIME ZONE;
    factories_array TEXT[] := ARRAY['CXC', 'CXM', 'CXD', 'CXE', 'CXF', 'CXB', 'EXT', 'FPC', 'FPB', 'FSP', 'MNT'];
    departments_array TEXT[] := ARRAY['Quality', 'Maintenance', 'Production', 'Planning', 'Logistics', 'Warehouse', 'Engineering', 'Administration'];
    roles_array TEXT[] := ARRAY['Manager', 'Admin', 'Supervisor', 'Planner'];
    factory_name TEXT;
    dept_name TEXT;
    role_name TEXT;
    existing_role_id BIGINT;
BEGIN
    -- Obtener el ID del empleado carlos.rodriguez
    SELECT id INTO employee_id_var
    FROM mr_employees
    WHERE email = 'carlos.rodriguez@coexpan.com';
    
    IF employee_id_var IS NULL THEN
        RAISE EXCEPTION 'Empleado carlos.rodriguez@coexpan.com no encontrado';
    END IF;
    
    -- Inicializar timestamp
    ts_now := NOW();
    
    RAISE NOTICE 'Asignando permisos completos al empleado ID: %', employee_id_var;
    
    -- Iterar sobre todas las combinaciones de factory, department y role
    FOREACH factory_name IN ARRAY factories_array
    LOOP
        FOREACH dept_name IN ARRAY departments_array
        LOOP
            FOREACH role_name IN ARRAY roles_array
            LOOP
                -- Verificar si el rol ya existe
                SELECT id INTO existing_role_id
                FROM mr_employee_authentik_roles
                WHERE employee_id = employee_id_var
                  AND factory = factory_name
                  AND department = dept_name
                  AND role = role_name;
                
                IF existing_role_id IS NULL THEN
                    -- Crear nuevo rol
                    INSERT INTO mr_employee_authentik_roles (
                        employee_id,
                        factory,
                        department,
                        role,
                        is_active,
                        assigned_at,
                        last_synced_at,
                        created_at,
                        updated_at
                    ) VALUES (
                        employee_id_var,
                        factory_name,
                        dept_name,
                        role_name,
                        TRUE,
                        ts_now,
                        ts_now,
                        ts_now,
                        ts_now
                    );
                    RAISE NOTICE 'Creado: % - % - %', factory_name, dept_name, role_name;
                ELSE
                    -- Actualizar rol existente para activarlo
                    UPDATE mr_employee_authentik_roles
                    SET is_active = TRUE,
                        last_synced_at = ts_now,
                        updated_at = ts_now
                    WHERE id = existing_role_id;
                    RAISE NOTICE 'Actualizado: % - % - %', factory_name, dept_name, role_name;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE 'Permisos completos asignados exitosamente';
END $$;

-- Verificar los permisos asignados
SELECT 
    factory,
    department,
    role,
    is_active,
    assigned_at
FROM mr_employee_authentik_roles
WHERE employee_id = (SELECT id FROM mr_employees WHERE email = 'carlos.rodriguez@coexpan.com')
ORDER BY factory, department, role;

