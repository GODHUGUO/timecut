# Charte Graphique — TimeCut

> **TimeCut** — *Your Ultimate Video Cutter*
> D'une longue vidéo à plusieurs clips viraux, en quelques clics.
>
> Version 1.0 · Juin 2026

---

## 1. La marque

**TimeCut** est un outil de découpage vidéo automatique pensé pour les créateurs de contenu, avec une forte orientation vers le marché africain (paiement Mobile Money, interface 100 % en français, sous-titres traduits).

| | |
|---|---|
| **Nom** | TimeCut |
| **Baseline (EN)** | Your Ultimate Video Cutter |
| **Promesse (FR)** | D'une longue vidéo à plusieurs clips viraux, en quelques clics. |
| **Valeurs** | Rapidité · Accessibilité · Simplicité · Ouverture (multilingue) |
| **Personnalité** | Moderne, énergique, technologique, inclusive |

---

## 2. Logo

### Construction
Le logotype combine deux mots accolés, sans espace :

> **Time**`Cut`

- **« Time »** → **blanc** (`#FFFFFF`)
- **« Cut »** → **violet** (`#7F13EC`)
- Précédé du symbole (icône applicative `logopng.png`)

### Règles d'usage
- Toujours conserver la bicolorité Time (blanc/sombre) + Cut (violet).
- Respecter une **zone de protection** minimale égale à la hauteur de la lettre « T » autour du logo.
- Taille minimale d'affichage : **24 px** de hauteur sur écran.
- Sur fond clair : « Time » passe en `#191022` (violet-noir), « Cut » reste `#7F13EC`.

### Interdits
- ❌ Ne pas déformer ni incliner le logo.
- ❌ Ne pas modifier les couleurs des deux mots.
- ❌ Ne pas ajouter d'ombre ou de contour non prévus.
- ❌ Ne pas séparer « Time » et « Cut » par un espace.

---

## 3. Palette de couleurs

### Couleurs principales

| Rôle | Nom | HEX | Aperçu / usage |
|------|-----|-----|----------------|
| **Fond principal** | Violet-Noir | `#191022` | Arrière-plan global, header, PWA `theme_color` |
| **Accent primaire** | Violet TimeCut | `#7F13EC` | Boutons, liens actifs, logo « Cut », bordures, icônes |
| **Accent clair** | Violet Hover | `#A855F7` | Survol des boutons et liens |

### Couleurs de surface (cartes & blocs)

| Rôle | HEX | Usage |
|------|-----|-------|
| Surface 1 | `#1E1333` | Cartes, encarts mis en avant |
| Surface 2 | `#2A1A44` | Sous-blocs internes, champs |
| Bordure subtile | `#7F13EC` à 20 % d'opacité | Contours de cartes (`border-[#7f13ec]/20`) |

### Couleurs de texte

| Rôle | Valeur | Usage |
|------|--------|-------|
| Texte principal | `#FFFFFF` | Titres, contenu fort |
| Texte secondaire | `#D1D5DB` (gray-300) | Paragraphes |
| Texte tertiaire | `#9CA3AF` (gray-400) | Descriptions, légendes |
| Texte discret | `#6B7280` (gray-500) | Mentions, notes |

### Couleurs d'état (sémantiques)

| État | HEX suggéré | Usage |
|------|-------------|-------|
| Succès | `#22C55E` | Confirmation de paiement, export réussi |
| Avertissement | `#F59E0B` | Quota presque épuisé |
| Erreur | `#EF4444` | Échec d'upload, paiement refusé |
| Information | `#7F13EC` | Messages neutres (cohérent avec l'accent) |

### Effet signature — « Glow » violet
TimeCut utilise une ombre lumineuse violette comme signature visuelle sur les éléments importants :

```css
box-shadow: 0 0 28px rgba(127, 19, 236, 0.55);
```

Variantes : `0.4` (boutons standards), `0.6` (CTA principal au survol).

---

## 4. Dégradés

| Nom | Définition | Usage |
|-----|------------|-------|
| Dégradé surface | `linear-gradient(135deg, #1E1333 → #191022)` | Grands encarts (ex. section Mobile Money) |
| Dégradé accent | `linear-gradient(135deg, #7F13EC → #A855F7)` | Éléments décoratifs, badges premium |

---

## 5. Typographie

### Police
Famille **sans-serif moderne** (gérée par `@nuxt/fonts`). Recommandation : **Inter** (ou équivalent système : `ui-sans-serif, system-ui`).

### Échelle typographique

| Niveau | Taille (desktop) | Graisse | Usage |
|--------|------------------|---------|-------|
| Display / H1 | 3 à 3.75 rem (`text-5xl`) | **Bold/Black** (700–900) | Titre Hero |
| H2 | 2.25 rem (`text-4xl`) | **Bold** (700) | Titres de section |
| H3 | 1.25–1.5 rem (`text-xl/2xl`) | **Semibold** (600) | Sous-titres, cartes |
| Corps | 1 rem (`text-base`) | Regular/Medium (400–500) | Paragraphes |
| Petit | 0.875 rem (`text-sm`) | Regular | Légendes, listes |
| Micro | 0.75 rem (`text-xs`) | Medium, souvent `uppercase tracking-widest` | Étiquettes, mentions |

### Règles
- Titres : interligne serré (`leading-tight`).
- Étiquettes (labels) : majuscules + interlettrage large (`uppercase tracking-widest`).
- Toujours assurer un contraste suffisant (texte clair sur fond `#191022`).

---

## 6. Iconographie

- **Bibliothèque : Lucide** (`lucide:*`), style trait fin et cohérent.
- Couleur par défaut des icônes d'accent : `#7F13EC`.
- Icônes représentatives de TimeCut : `scissors` (découpage), `file-text` (sous-titres), `languages` (traduction), `smartphone` (Mobile Money), `arrow-down`, `chevron-down`.
- Conserver une grille et une épaisseur de trait homogènes ; ne pas mélanger plusieurs styles d'icônes.

---

## 7. Composants UI

### Rayons d'arrondi
| Élément | Rayon | Classe |
|---------|-------|--------|
| Boutons standards | 0.5 rem | `rounded-lg` |
| Boutons pilule / CTA | plein | `rounded-full` |
| Cartes | 1 rem | `rounded-2xl` |
| Grands encarts | 1.5 rem | `rounded-3xl` |

### Boutons

**Bouton primaire (CTA)**
```
Fond #7F13EC · texte blanc · rounded-lg ou rounded-full
Survol : fond #A855F7 + scale 1.05 + glow violet
```

**Bouton secondaire (outline)**
```
Fond transparent · bordure #7F13EC à 30 % · texte blanc
Survol : bordure pleine #7F13EC + léger fond #7F13EC/10
```

### Cartes
```
Fond #191022 ou #1E1333
Bordure : #7F13EC à 20 %
Rayon : rounded-2xl · padding généreux (2 rem)
Survol : bordure #7F13EC pleine
```

### Badges
```
Fond #7F13EC/20 · texte #7F13EC · rounded-full · text-sm
Ex. « Pensé pour les créateurs en Afrique », « Populaire »
```

---

## 8. Animations & mouvement

TimeCut s'appuie sur **GSAP / ScrollTrigger** pour des apparitions fluides.

| Type | Réglage type |
|------|--------------|
| Easing | `power3.out` |
| Apparition au scroll | `opacity 0→1`, `y 40→0`, durée ~0.7 s |
| Décalage (stagger) | 0.13 à 0.22 s entre éléments |
| Survol boutons | `scale 1.05`, transition 300 ms |

**Principe** : le mouvement doit rester **subtil et rapide** — il accompagne, il ne distrait pas.

---

## 9. Ton & rédaction

- **Langue principale : français.** Ton direct, chaleureux, orienté bénéfice.
- Tutoiement léger / vouvoiement professionnel (le site emploie le **vous**).
- Phrases courtes et concrètes : *« D'une longue vidéo à plusieurs clips viraux. »*
- Mettre en avant les différenciateurs : **Mobile Money**, **sans carte bancaire**, **sous-titres traduits**, **tarifs accessibles**.
- Éviter le jargon technique inutile auprès des créateurs.

---

## 10. Application PWA / Mobile

| Paramètre | Valeur |
|-----------|--------|
| `theme_color` | `#191022` |
| `background_color` | `#191022` |
| Affichage | `standalone` (look natif) |
| Orientation | `portrait` |
| Icônes | 192×192 et 512×512 (dont `maskable`) |

---

## Annexe — Mémo couleurs rapide

```
Fond principal     #191022
Accent primaire    #7F13EC
Accent hover       #A855F7
Surface 1          #1E1333
Surface 2          #2A1A44
Texte principal    #FFFFFF
Texte secondaire   #D1D5DB
Glow signature     rgba(127,19,236,0.55)
```

---

*Charte graphique TimeCut — document de référence interne. Toute déclinaison visuelle doit respecter ces règles afin d'assurer la cohérence de la marque.*
