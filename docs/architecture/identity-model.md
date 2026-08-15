# Modèle d’identité LexManage

LexManage applique actuellement un modèle **un compte = un cabinet** :

- l’adresse email d’un utilisateur est unique globalement ;
- chaque utilisateur possède exactement un `tenantId` ;
- une invitation permet de rejoindre un cabinet uniquement si cette adresse email ne possède pas déjà de compte ;
- les rôles (`CABINET_ADMIN`, `LAWYER`, `ASSISTANT`, `SECRETARY`) sont portés par l’utilisateur dans son cabinet ;
- `SUPER_ADMIN` est réservé à l’administration de la plateforme et ne peut pas être attribué par un cabinet.

Ce choix est volontaire pour la première version mobile et SaaS. Un utilisateur devant travailler pour deux cabinets doit utiliser deux adresses professionnelles distinctes.

Une future prise en charge multi-cabinets nécessitera un modèle `Membership(userId, tenantId, role)` et la sélection explicite du cabinet actif dans les tokens, les caches, les sockets et l’interface. Elle ne doit pas être implémentée en supprimant simplement l’unicité de l’email.
