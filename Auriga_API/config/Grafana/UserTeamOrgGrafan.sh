#!/bin/bash

# Script: UserTeamOrgGrafan.sh
# Uso: MAIN_ORG="CX" ./UserTeamOrgGrafan.sh config.json
#
# Descripción:
# Este script gestiona usuarios, equipos y organizaciones en Grafana
# basado en un archivo de configuración JSON. Los usuarios se crean
# globalmente y se asignan a sus organizaciones específicas y a una
# organización principal (MAIN_ORG) con rol Viewer. No se añade ningún
# usuario a la organización por defecto "Main Org.".

set -e

# Configuración
GRAFANA_URL="http://18.213.58.26:33003"
ADMIN_USER="jr"
ADMIN_PASSWORD="lHevDgr_aqHDlBOpQirf28"
CONFIG_FILE="${1:-config.json}"
MAIN_ORG="${MAIN_ORG}"  # REQUERIDO

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Funciones de log
log_info() { echo -e "${BLUE}[INFO]${NC} $1" >&2; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

# Función para API requests
api_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local org_id="$4"
    
    local curl_cmd=("curl" "-s" "-w" "\n%{http_code}" "-X" "$method")
    curl_cmd+=("-u" "$ADMIN_USER:$ADMIN_PASSWORD")
    curl_cmd+=("-H" "Content-Type: application/json")
    
    local clean_org_id=$(echo "$org_id" | grep -o '[0-9]*' | head -1)
    
    if [ -n "$clean_org_id" ] && [ "$clean_org_id" != "null" ]; then
        curl_cmd+=("-H" "X-Grafana-Org-Id: $clean_org_id")
    fi
    
    if [ -n "$data" ] && [ "$data" != "null" ]; then
        curl_cmd+=("-d" "$data")
    fi
    
    curl_cmd+=("$GRAFANA_URL$endpoint")
    
    local response
    response=$("${curl_cmd[@]}" 2>/dev/null)
    local http_code="${response##*$'\n'}"
    local json_response="${response%$'\n'*}"
    
    http_code=$(echo "$http_code" | tr -cd '[:digit:]')
    
    echo "$http_code:$json_response"
}

# Verificar dependencias
verify_dependencies() {
    if ! command -v jq &> /dev/null; then
        log_error "jq no está instalado"
        exit 1
    fi
}

# Verificar conexión
verify_grafana_connection() {
    log_info "Verificando conexión con Grafana..."
    local response
    response=$(curl -s -w "%{http_code}" -u "$ADMIN_USER:$ADMIN_PASSWORD" \
        "$GRAFANA_URL/api/health")
    
    local http_code="${response: -3}"
    if [ "$http_code" != "200" ]; then
        log_error "No se puede conectar a Grafana. Verifica URL y credenciales."
        exit 1
    fi
    log_success "Conexión con Grafana establecida"
}

# Obtener ID de organización por nombre
get_org_id_by_name() {
    local org_name="$1"
    
    local response
    response=$(api_request "GET" "/api/orgs")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        local org_id=$(echo "$json_response" | jq -r ".[] | select(.name == \"$org_name\") | .id")
        if [ -n "$org_id" ] && [ "$org_id" != "null" ]; then
            echo "$org_id"
        else
            echo "null"
        fi
    else
        echo "null"
    fi
}

# Crear organización si no existe
ensure_organization() {
    local org_name="$1"
    
    local org_id=$(get_org_id_by_name "$org_name")
    if [ "$org_id" != "null" ]; then
        log_success "Organización $org_name ya existe con ID: $org_id"
        echo "$org_id"
        return
    fi
    
    log_info "Creando organización: $org_name"
    local org_json="{\"name\": \"$org_name\"}"
    local response
    response=$(api_request "POST" "/api/orgs" "$org_json")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        local org_id=$(echo "$json_response" | jq -r '.orgId')
        log_success "Organización $org_name creada con ID: $org_id"
        echo "$org_id"
    else
        log_error "Error creando organización $org_name: HTTP $http_code"
        echo "null"
    fi
}

# Crear usuario global (sin añadir a ninguna organización automáticamente)
create_user() {
    local user_data="$1"
    local login=$(echo "$user_data" | jq -r '.login')
    
    log_info "Creando usuario: $login"
    
    local user_json=$(echo "$user_data" | jq -c '{
        name: .name,
        email: .email,
        login: .login,
        password: .password
    }')
    
    local response
    response=$(api_request "POST" "/api/admin/users" "$user_json")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        local user_id=$(echo "$json_response" | jq -r '.id')
        log_success "Usuario $login creado con ID: $user_id"
        echo "$user_id"
    elif [ "$http_code" == "412" ]; then
        log_warning "Usuario $login ya existe, obteniendo ID..."
        local user_search
        user_search=$(api_request "GET" "/api/users/lookup?loginOrEmail=$login")
        local search_http_code="${user_search%%:*}"
        local search_json="${user_search#*:}"
        
        if [ "$search_http_code" == "200" ]; then
            local user_id=$(echo "$search_json" | jq -r '.id')
            log_success "Usuario $login encontrado con ID: $user_id"
            echo "$user_id"
        else
            log_error "Error buscando usuario $login"
            echo "null"
        fi
    else
        log_error "Error creando usuario $login: HTTP $http_code"
        echo "null"
    fi
}

# Añadir usuario a organización específica
add_user_to_org() {
    local org_id="$1"
    local user_login="$2"
    local role="$3"
    
    log_info "Añadiendo usuario $user_login a organización con rol: $role"
    
    local user_json="{\"role\": \"$role\", \"loginOrEmail\": \"$user_login\"}"
    local response
    response=$(api_request "POST" "/api/orgs/$org_id/users" "$user_json")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        log_success "Usuario $user_login añadido a organización con rol $role"
    elif [ "$http_code" == "409" ]; then
        log_warning "Usuario $user_login ya existe en la organización"
    else
        log_warning "Error añadiendo usuario $user_login a organización: HTTP $http_code"
    fi
}

# Remover usuario de Main Org. por defecto si fue añadido automáticamente
remove_user_from_default_org() {
    local user_id="$1"
    local user_login="$2"
    
    local default_org_id=$(get_org_id_by_name "Main Org.")
    if [ "$default_org_id" == "null" ]; then
        return  # No existe Main Org.
    fi
    
    log_info "Verificando si usuario $user_login está en Main Org..."
    
    # Verificar si el usuario está en Main Org.
    local response
    response=$(api_request "GET" "/api/orgs/$default_org_id/users")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        local user_in_org=$(echo "$json_response" | jq -r ".[] | select(.login == \"$user_login\") | .userId")
        if [ -n "$user_in_org" ]; then
            log_info "Removiendo usuario $user_login de Main Org..."
            local delete_response
            delete_response=$(api_request "DELETE" "/api/orgs/$default_org_id/users/$user_id")
            local delete_code="${delete_response%%:*}"
            
            if [ "$delete_code" == "200" ]; then
                log_success "Usuario $user_login removido de Main Org."
            else
                log_warning "No se pudo remover usuario de Main Org.: HTTP $delete_code"
            fi
        else
            log_info "Usuario $user_login no está en Main Org."
        fi
    fi
}

# Crear equipo
create_team() {
    local org_id="$1"
    local team_data="$2"
    
    local team_name=$(echo "$team_data" | jq -r '.name')
    local team_email=$(echo "$team_data" | jq -r '.email // empty')
    
    log_info "Creando equipo: $team_name"
    
    local team_json
    if [ -n "$team_email" ] && [ "$team_email" != "null" ]; then
        team_json="{\"name\": \"$team_name\", \"email\": \"$team_email\"}"
    else
        team_json="{\"name\": \"$team_name\"}"
    fi
    
    local response
    response=$(api_request "POST" "/api/teams" "$team_json" "$org_id")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        local team_id=$(echo "$json_response" | jq -r '.teamId')
        log_success "Equipo $team_name creado con ID: $team_id"
        echo "$team_id"
    elif [ "$http_code" == "409" ]; then
        log_warning "Equipo $team_name ya existe, obteniendo ID..."
        local team_search
        team_search=$(api_request "GET" "/api/teams/search?name=$team_name" "" "$org_id")
        local search_http_code="${team_search%%:*}"
        local search_json="${team_search#*:}"
        
        if [ "$search_http_code" == "200" ]; then
            local team_id=$(echo "$search_json" | jq -r '.teams[0].id')
            if [ -n "$team_id" ] && [ "$team_id" != "null" ]; then
                log_success "Equipo $team_name encontrado con ID: $team_id"
                echo "$team_id"
            else
                log_error "Equipo $team_name no encontrado en la búsqueda"
                echo "null"
            fi
        else
            log_error "Error buscando equipo $team_name: HTTP $search_http_code"
            echo "null"
        fi
    else
        log_error "Error creando equipo $team_name: HTTP $http_code"
        echo "null"
    fi
}

# Añadir usuario al equipo
add_user_to_team() {
    local org_id="$1"
    local team_id="$2"
    local user_id="$3"
    
    log_info "Añadiendo usuario ID $user_id al equipo ID $team_id"
    
    local member_json="{\"userId\": $user_id}"
    local response
    response=$(api_request "POST" "/api/teams/$team_id/members" "$member_json" "$org_id")
    local http_code="${response%%:*}"
    local json_response="${response#*:}"
    
    if [ "$http_code" == "200" ]; then
        log_success "Usuario añadido al equipo correctamente"
    elif [ "$http_code" == "409" ]; then
        log_warning "Usuario ya es miembro del equipo"
    else
        log_warning "Error añadiendo usuario al equipo: HTTP $http_code"
    fi
}

# Función principal
main() {
    if [ -z "$MAIN_ORG" ]; then
        log_error "La variable MAIN_ORG debe ser especificada"
        log_error "Uso: MAIN_ORG='NombreOrg' ./script.sh config.json"
        exit 1
    fi
    
    verify_dependencies
    verify_grafana_connection
    
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Archivo de configuración no encontrado: $CONFIG_FILE"
        exit 1
    fi
    
    log_info "Organización principal: $MAIN_ORG"
    log_info "Los usuarios NO serán añadidos a 'Main Org.'"
    log_info "Cargando configuración desde: $CONFIG_FILE"
    
    local config_json
    config_json=$(cat "$CONFIG_FILE")
    
    # Asegurar que la organización principal existe
    local main_org_id=$(ensure_organization "$MAIN_ORG")
    if [ "$main_org_id" == "null" ]; then
        log_error "No se pudo crear/obtener la organización principal: $MAIN_ORG"
        exit 1
    fi
    
    # Mapeo global de usuarios
    declare -A global_users
    
    # Primera pasada: crear todos los usuarios
    log_info "=== CREANDO USUARIOS ==="
    local org_count
    org_count=$(echo "$config_json" | jq '.organizations | length')
    
    for ((i=0; i<org_count; i++)); do
        local org_json
        org_json=$(echo "$config_json" | jq -c ".organizations[$i]")
        local user_count
        user_count=$(echo "$org_json" | jq '.users | length')
        
        for ((j=0; j<user_count; j++)); do
            local user_json
            user_json=$(echo "$org_json" | jq -c ".users[$j]")
            local login
            login=$(echo "$user_json" | jq -r '.login')
            
            if [ -z "${global_users[$login]+x}" ]; then
                user_id=$(create_user "$user_json")
                if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
                    global_users["$login"]=$user_id
                    
                    # Remover usuario de Main Org. si fue añadido automáticamente
                    remove_user_from_default_org "$user_id" "$login"
                fi
            fi
        done
    done
    
    # Segunda pasada: procesar organizaciones específicas
    log_info "=== PROCESANDO ORGANIZACIONES ESPECÍFICAS ==="
    for ((i=0; i<org_count; i++)); do
        local org_json
        org_json=$(echo "$config_json" | jq -c ".organizations[$i]")
        local org_name
        org_name=$(echo "$org_json" | jq -r '.name')
        
        log_info "Procesando organización: $org_name"
        
        # Asegurar que la organización existe
        local org_id=$(ensure_organization "$org_name")
        local clean_org_id=$(echo "$org_id" | grep -o '[0-9]*' | head -1)
        
        if [ -z "$clean_org_id" ] || [ "$clean_org_id" == "null" ]; then
            log_error "No se pudo crear/obtener la organización $org_name, saltando..."
            continue
        fi
        
        # Añadir usuarios a la organización
        local user_count
        user_count=$(echo "$org_json" | jq '.users | length')
        for ((j=0; j<user_count; j++)); do
            local user_json
            user_json=$(echo "$org_json" | jq -c ".users[$j]")
            local login
            login=$(echo "$user_json" | jq -r '.login')
            local role
            role=$(echo "$user_json" | jq -r '.role')
            
            user_id="${global_users[$login]}"
            if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
                add_user_to_org "$clean_org_id" "$login" "$role"
            else
                log_error "Usuario $login no encontrado"
            fi
        done
        
        # Crear equipos
        local team_count
        team_count=$(echo "$org_json" | jq '.teams | length')
        for ((j=0; j<team_count; j++)); do
            local team_json
            team_json=$(echo "$org_json" | jq -c ".teams[$j]")
            local team_name
            team_name=$(echo "$team_json" | jq -r '.name')
            
            team_id=$(create_team "$clean_org_id" "$team_json")
            clean_team_id=$(echo "$team_id" | grep -o '[0-9]*' | head -1)
            
            if [ -z "$clean_team_id" ] || [ "$clean_team_id" == "null" ]; then
                log_error "No se pudo crear el equipo $team_name, saltando..."
                continue
            fi
            
            # Añadir miembros al equipo
            local members
            members=$(echo "$team_json" | jq -r '.members[]?')
            for member_login in $members; do
                user_id="${global_users[$member_login]}"
                if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
                    add_user_to_team "$clean_org_id" "$clean_team_id" "$user_id"
                else
                    log_error "Usuario $member_login no encontrado"
                fi
            done
        done
    done
    
    # Tercera pasada: Añadir todos los usuarios a MAIN_ORG
    log_info "=== AÑADIENDO USUARIOS A ORGANIZACIÓN PRINCIPAL: $MAIN_ORG ==="
    for login in "${!global_users[@]}"; do
        user_id="${global_users[$login]}"
        if [ -n "$user_id" ] && [ "$user_id" != "null" ]; then
            add_user_to_org "$main_org_id" "$login" "Viewer"
        fi
    done
    
    log_success "=== PROCESO COMPLETADO ==="
    log_info "Resumen:"
    echo "Usuarios creados: ${#global_users[@]}"
    echo "Organización principal: $MAIN_ORG (ID: $main_org_id)"
    echo ""
    echo "✅ Todos los usuarios pertenecen a:"
    echo "   - Su organización específica (rol definido en config)"
    echo "   - $MAIN_ORG (rol Viewer)"
    echo "🚫 Ningún usuario pertenece a 'Main Org.'"
}

# Ejecutar
main "$@"