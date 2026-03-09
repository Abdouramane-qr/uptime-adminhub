# Backend Contracts Spec - Sprint 2

Date: 2026-03-09
Scope: contrats dédiés `billing`, `technicians`, `audit-logs`
Consumers: `uptime-adminhub` pages Billing/Technicians/AuditLogs

## 1) Billing Contract

### Endpoint
`GET /functions/v1/admin-portal/billing/invoices`

### Query params
- `from` (ISO date, optional)
- `to` (ISO date, optional)
- `status` (`paid|pending|overdue|cancelled`, optional)
- `search` (string, optional)
- `page` (number, optional)
- `page_size` (number, optional)

### Response (200)
```json
{
  "items": [
    {
      "id": "INV-0501",
      "date": "2026-03-08",
      "client": "Metro Fleet Co",
      "provider": "AutoFix Pro",
      "intervention_id": "INT-0401",
      "amount": 450,
      "commission": 67.5,
      "status": "pending"
    }
  ],
  "totals": {
    "paid_revenue": 2530,
    "commissions": 379.5,
    "pending_amount": 800
  },
  "pagination": {
    "page": 1,
    "page_size": 25,
    "total": 120
  }
}
```

### Errors
- `401 unauthorized`
- `403 admin_required`
- `422 validation_error`
- `500 internal_error`

### Frontend impact
- Supprime la projection depuis `service_requests` dans `Billing.tsx`.
- Utilise `totals` backend au lieu de recalcul local.

## 2) Technicians Contract

### Endpoint
`GET /functions/v1/admin-portal/technicians`

### Query params
- `status` (`online|offline|on_job`, optional)
- `search` (string, optional)
- `provider_id` (optional)

### Response (200)
```json
{
  "items": [
    {
      "id": "T001",
      "name": "Jean Dupont",
      "provider": "AutoFix Pro",
      "status": "on_job",
      "phone": "+33 6 12 34 56 78",
      "location": "Paris",
      "completed_interventions": 142,
      "rating": 4.8,
      "specialties": ["Remorquage", "Batterie"],
      "current_mission": "INT-0401",
      "joined_at": "2024-01-10"
    }
  ]
}
```

### Errors
- `401 unauthorized`
- `403 admin_required`
- `500 internal_error`

### Frontend impact
- Supprime la projection depuis `provider_presence` dans `Technicians.tsx`.
- Conserve filtres et détail technician sans transformation ad hoc.

## 3) Audit Logs Contract

### Endpoint
`GET /functions/v1/admin-portal/audit-logs`

### Query params
- `from` (ISO datetime, optional)
- `to` (ISO datetime, optional)
- `action` (`assign|status_change|create|delete|update|login`, optional)
- `search` (string, optional)
- `page` (number, optional)
- `page_size` (number, optional)

### Response (200)
```json
{
  "items": [
    {
      "id": "LOG-001",
      "date": "2026-03-08T14:32:00Z",
      "actor": "Admin User",
      "action": "assign",
      "description": "Mission INT-0401 assignée à AutoFix Pro",
      "target": "INT-0401"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 820
  }
}
```

### Errors
- `401 unauthorized`
- `403 admin_required`
- `500 internal_error`

### Frontend impact
- Supprime la projection depuis `service_requests` dans `AuditLogs.tsx`.
- Utilise dates backend au format ISO, formatting UI côté client.

## 4) Contract Rules (cross-cutting)

- Tous les endpoints sont protégés par gate admin.
- Schéma de réponse standard:
  - succès liste: `{ items: [...], ...meta }`
  - erreur: `{ error: "...", code: "..." }`
- Les enum status/action doivent rester strictement stables pour éviter les mappings front fragiles.
- Toute nouvelle clé est additive (non-breaking); ne jamais renommer/supprimer sans versioning.

## 5) Rollout Plan

1. Implémenter endpoint `billing/invoices`.
2. Implémenter endpoint `technicians`.
3. Implémenter endpoint `audit-logs`.
4. Ajouter méthodes client dans `adminPortalClient.ts`.
5. Basculer pages React vers nouveaux endpoints.
6. Désactiver fallback sur ces 3 pages en staging strict.
