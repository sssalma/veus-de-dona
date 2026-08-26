"""Seed texts linking authors to their corresponding parades, scraped from the real website."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from scripts.scraper_autores import partir_nom
from app.models.autora import Autora
from app.models.parada import Parada
from app.models.text import Text
from app.models.like import Like

TEXTOS_DATA = [
    {
        "autora_nom": "Montserrat Abelló i Soler",
        "titol": "Retorn",
        "obra_origen": "Vida diària, 1963",
        "contingut": """Cert que he viscut en altres contrades
amb horitzons cenyits d'altíssimes muntanyes nues
i un mar fred i extens.
Però encara que les muntanyes i el mar
i els núvols repetien
geografia sobre geografia,
flor sobre flor,
i núvol sobre núvol,
en una incansable lletania,
i restàvem estàtics
al peu de la pedra,
no es mitigà per això el record
de la teva sang, la somorta sang teva,
que corre sota la figuera
i les verdes cales,
i s'aturà al peu de la barca.
L'alta muntanya era una gran cortina
que no deixava veure
l'escala de mà al fons de l'escenari,
els focus violents,
els trapezis, la corda penjada.
Asseguda d'esquena a la muntanya,
contemplava el mar
i la mà, sempre la mà viva d'homes i dones.
Però així com la roca es desprèn,
vençuda pel pes de la neu,
o així com la corda deslliura la barca
per l'impuls massa fort de l'onada,
així ha estat d'inevitable el meu retorn.
I ara, aquí, replantada
damunt aquesta assedegada terra,
us he vist passar, tots vosaltres.
És per això que ara cerco camins,
l'ombra dels arbres, la fosca obaga
contra les blanques cases.
I així, arrecerada,
escolto el so de la paraula vostra i meva.
Com l'aigua que traspua
de la paret ombriva,
verda de molsa, i lenta;
es transforma en una sola gota clara.
I ara, asseguda al llindar de casa meva,
soc amb vosaltres.""",
        "ordre_parada": 1,
    },
    {
        "autora_nom": "Olga Xirinacs i Díaz",
        "titol": "Música de cambra I",
        "obra_origen": "Música de cambra, 1982",
        "contingut": """A l'habitació groga on escric, la finestra, que ocupa tota la paret frontal, s'obre al mar en tota l'amplària. La vista immediata és el passeig, limitat pel Balcó del Mediterrani, de trenta metres d'alçada, on la tradició és arribar des de la Rambla a «tocar ferro».

Molts anys enrera alguns suïcides havien fet des d'aquí el vol final; altres l'havien intentat, i el dubte els feia evidents; per això més d'un cop hem procurat la dissuasió, amb un acostament confiat. Quan se sabia el fet la gent s'abocava guaitar, en una morbosa i esgarrifada atracció; esperaven de l'autoritat i el que se'n deia la pastera, que s'emportava el cos del suïcida. Els avis, des del menjador, havien vist com es tirava una dona, crec que era jove.

Anava vestida de blanc i les faldilles li voleiaven com una campànula: l'única flor per a una mort ben sola. Alguna vegada els pins de sota paraven la caiguda, o podia ben ser que trossegessin el cos, amb la força de l'embranzida. Els ulls al cel o a la terra, què hi fa!, la sang pasta la pols, potser alguna salvatgina fa la vetlla nocturna.

La lluna fa el ple. És un juny avançat i fa calor.""",
        "ordre_parada": 1,
    },
    {
        "autora_nom": "Lurdes Malgrat i Escarp",
        "titol": "Silenci",
        "obra_origen": "Senyals a la costa, 2019",
        "contingut": """La música s'escampa per la plaça com un vol obert de coloms,
els contorns de les notes m'insinuen la sensualitat del cos
i escolto, escric paraules, respiro, apaivago l'ànima, el seu impuls,
s'enlaira la melodia, progressa i ocupa altres carrers, altres places,
altres balcons. Galopo amb els acords deixant-me portar
a una altra dimensió i penso una vida que no és la d'aquest món.
Importa el gest, la mirada directa, la tremolor que calla, la raó.
Timbals, trompetes, bateries aixequen els ulls al cel, cadires esteses,
gent, camins cansats. Escric paraules per no haver de dir-les.
La faldilla s'envola, l'aire de juliol obre la vesprada, esclat de palmes,
i el joc, el joc que segueix i rodola ja més enllà de la Rambla
i baixa cap a la mar amb el fil de veu de pandereta i d'ulls llunyans.
Incita el ritme, s'esmicolen els últims records i la ràbia clama
com una ungla que rasca la ferida mig assecada, la sang morta.
Importa la renúncia i el vol d'un colom solitari a l'altra banda
de la barana acabada de pintar, d'aquest ferro que separa,
d'aquest ull de ciutat, d'aquest plor que no pot ser plor,
d'aquestes paraules que escric per poder callar, quan la música
acabi, quan la darrera nota pesi tant que esclafi el cel,
el vol de coloms i el carrer estret.""",
        "ordre_parada": 1,
    },
    {
        "autora_nom": "Noemi Bagés i Fortacín",
        "titol": "Perdoni a quin segle diu que som? I",
        "obra_origen": "Perdoni, a quin segle diu que som?, 2004",
        "contingut": """Si el que havien vist fins ara els havia impressionat, ja no tindrien paraules per expressar quina sensació els provocava el que han trobat en ser fora de la muralla. Davant seu s'estenia, immensa, la Mediterrània, en la qual es reflectia la llum de la lluna, calmadíssima, com un mirall. Més propera, la platja. I just al davant, magnífic, el gran amfiteatre.

Mai no havien imaginat que pogués haver estat tan gran. Com s'ho devien fer els romans per erigir construccions tan colossals? Els arcs eren incomptables i l'alçada, extraordinària. Quant de temps devien haver trigat a construir-lo? Quantes persones hi devien haver treballat? Han continuat endavant, per la via empedrada, i han deixat enrere l'edifici monumental presidint tota la costa de Tàrraco. Els navegants que es dirigien al seu port trobaven, des del mar, un senyal inequívoc d'una gran civilització.""",
        "ordre_parada": 2,
    },
    {
        "autora_nom": "Isabel Ortega i Rion",
        "titol": "Ran de mar",
        "obra_origen": "Enfilall, 2002",
        "contingut": """El meu poble fa olor d'escata de sorell,
té color de mel vella o d'avellana tendra,
i de la mar rep sempre la besada de plata.

El meu poble és encara la dona que estén roba
i s'aconsola amb cants i rondina i feineja
com una vella esquerpa, però amb cor de bolero.

He vist els darrers carros, els primers automòbils;
he vist com esborraven els conreus vora el riu.
Vora el riu creix ciment que s'alça contra els núvols,
engoleix els capvespres i encén fanals altius.

Bravateja el meu poble amb un vestit balder
de cosmopolitisme. És tan senzill ser ric
i modern si s'escau! Només cal renunciar
a la matèria pròpia, vendre el ritme del cor
per un grapat de pressa que guiarà inclement
un rellotge de marca. Tanmateix, el meu poble
té el tacte vellutat de pols de llibres vells
i l'enyor d'un passat que de cop s'alça i crida
contra les veus que menen a un mimètic futur.

I jo, que he renunciat al vell provincianisme
fugint cap al més nou miratge del present,
em quedo amb el vespre d'una tardor plorosa
i amb el so de campanes que acompanya silent
els carrers empedrats on el temps es detura.

Em quedo amb l'argila de les velles façanes,
préssec assaonat, memòria engalanada
que se'n riu, dels nous temps, perquè miola un gat,
perquè la pluja torna i els coloms s'aixopluguen
a recer d'unes passes que pertorben debades
la marxa cadenciosa d'instants inabastables.

Perquè el temps es detura, a voltes, al meu poble.""",
        "ordre_parada": 3,
    },
    {
        "autora_nom": "Cinta Mulet i Grau",
        "titol": "Vull pujar en aquell terrat",
        "obra_origen": "Només un fil de llum blanca, Arola Editors",
        "contingut": """Vull pujar en aquell terrat,
en el meu barri de gitanos,
gleva de pell morena
on les guitarres fan escacs i sardanes.

La veu del gitano plora
sobre la pedra que travessa:
amors trencats en la branca,
pugen els plors com els arbres.

Crida, com un boig, a un cel desert d'estrelles.
Y ella no me quiere! Por qué
no me quiere, si yo aún la quiero?

El gitano, partit per la tenebra,
arrenca la força al mar i a la terra
perquè ella el senti o s'encenguin
aquelles parets en flames:
fugen les flors de la Lluna, en sentir-lo,
i comença el combat de llances;
creix la mort i les punxes,
i s'esgarra en crits, l'aire.

Mentre dorm el veïnat,
aquell gitano enclava els gemecs
com cimals a les campanes
i, encara, a cada tarda que toquen,
s'omple la plaça de pendons negres.

Aquells senyals saben,
fora d'hores i de llums que callen,
que allí, va plorar d'amor, un home,
ara que ningú en plora, i de pena:
aquella nit blanca de pell morena.""",
        "ordre_parada": 4,
    },
    {
        "autora_nom": "Maria Domènech i Escoté",
        "titol": "Costums tarragonines",
        "obra_origen": "Quadret de costums tarragoninas, 1906",
        "contingut": """Tot i essent el dijous Sant, eren les tres de la tarda quan la Tecleta sortia del treballador. En els dies aquells les modistes no s'entenien de feina; a totes les dones (...) i com la principal seva tenia tanta anomenada, això feia que mai acabessin la feina. Com de costum, a la Tecleta, al sortir de casa la modista l'esperava cada dia el Pepitu i feien petar la xerradeta...

Aquell dia a ell, com no havia d'anar al treballador, no li feia res esperar-se, encara que fos tard, havia dinat tot de pressa y sense ni mudar-se la roba, deixant-ho per més tard, se'n va anar al punt de guàrdia, com ell en deia.

Si els pares d'ella els hi haguessin atrapat, Déu nos en guard. Ella, sa filla... festejar amb aquell gandul mort de fam, que tants anys que feia d'ebenista i encara no sabia fer-se una mala calaixera... Això mai, altres pretensions tenien per sa filla.""",
        "ordre_parada": 4,
    },
    {
        "autora_nom": "Olga Xirinacs i Díaz",
        "titol": "La placeta dels Àngels",
        "obra_origen": "Clau de blau, 1978",
        "contingut": """La placeta dels Àngels ens envolta
i li triem paraules cabalístiques
per definir els carrers de les tardes jueves,
amb el cant vertical i olor de fosca a les arcades.

Recorrem amb la punta dels dits
els signes de pregàries al sòl atapeït.
S'hi encenen brases en galledes
els geranis observen la vida
fragmentats per la roba dels balcons
i pel dolor que bressa els palmells i els genolls
d'infants tan pàl·lids com les llunes
que mai no glacen les finestres.""",
        "ordre_parada": 5,
    },
    {
        "autora_nom": "Margarida Aritzeta i Abad",
        "titol": "Rapsòdia per a un mort II",
        "obra_origen": "Rapsòdia per a un mort, 2018",
        "contingut": """Fa una estona que en Kàputx seu, amb el portàtil damunt la taula, en una de les terrasses de la plaça del Fòrum. Sempre li ha agradat aquest lloc que conserva, enmig de l'espai enllosat, les restes d'un enorme mur de pedra amb tres obertures rectangulars, dues arran de terra, com dos portals, i una altra d'elevada, com un finestral. Són la resta dels antics pòrtics del Fòrum de la ciutat. Aquí es trobava la gent, s'hi feien mercats, era un dels punts neuràlgics de la Tarragona romana. A través d'aquestes obertures de mida ciclòpia el periodista contempla portes i finestres de l'edifici del fons, que semblen, per contrast, d'una casa de nines. Hem anat a menys, pensa. En proporcions, en mesures, en ambició. En grandesa. Com cada vespre, hi ha criatures que juguen a passar d'una banda a l'altra d'aquests pòrtics, com si fossin capaces d'entrar en un altre món i tornar-ne a sortir de seguida. Però el passat és mort i l'altre món no existeix. El mur, escarbotat, dolorosament mutilat, a penes uns metres de carreus de pedra castigada pels segles, fora de lloc i fora d'època, ja només és el testimoni mut d'una antiga grandesa enderrocada, una peça del mapa virtual d'un parc temàtic, un lloc per fer-se fotos o penjar vídeos a Instagram.""",
        "ordre_parada": 6,
    },
    {
        "autora_nom": "Isabel Ortega i Rion",
        "titol": "Tatuic",
        "obra_origen": "Nòmada, 2009",
        "contingut": """La ciutat capgirada als tolls d'aigua de pluja
sembla un mirall: senàçaf, sedànoclab. Tot llum
contra la nit, estrelles com fanals d'unes barques
que llisquen per la rada. Tot remor com de mar adormida.
Voldria capbussar-m'hi, abraçar l'aigua amiga,
dissoldre'm, ser la bombolla d'aire
que pobla un trajecte silenciós. Tot baf,
tot lleugeresa, com un somni sense somnis.

M'hi veig mirant amunt, que miro avall, que soc
cos d'aigua, peix i ocell, sirena urbana,
i sento aquesta felicitat pertorbada
que només tenen les persones tristes.""",
        "ordre_parada": 6,
    },
    {
        "autora_nom": "Josepa Massanés i Dalmau",
        "titol": "Als bons pagesos",
        "obra_origen": "Antología poética, 1991 (original de 1863)",
        "contingut": """Què tenen los cantars de ma nativa llengua,
que lo cor al sentirlos bat més fort i depressa,
i sonriuen los llavis, i los ulls s'humitejan?
No té armonía y gracia la parla de Castella,
dolsura la toscana i forsa la francesa?
Donchs, per què quan los càntichs
nostres paysans axecan ab accents d'alegría,
d'amor ò de tristesa, totes les melodíes
olvidem de la terra, com tota veu s'olvida
sentint la veu materna?
Oh, què dols es probar ne exa santa tendresa,
que als turons de la patria ab flors ens encadena!
i quan la patria es noble, i, com la nostra, immensa
es la gloria dels títols de sa antigua noblesa,
no hi hà orgull més llegítim que'l que sentim per ella.
Lo ser català es honra! A Deu gracies rendesca
qui la sanch catalana sent bullir en ses venes,
i en son front honrat porta barretina vermella.""",
        "ordre_parada": 7,
    },
    {
        "autora_nom": "Roser Guasch i Bea",
        "titol": "Laberint",
        "obra_origen": "L'amistat de les pedres, 1999",
        "contingut": """Com que no trobarem la llum,
haurem de perseguir la veu.
Iniciarem el joc de les paraules
I un altre univers
vindrà per dir-nos qui som.
Voltarem els carrers antics
i ens tornarem a perdre.
L'aigua última,
escolada entre les pedres,
ens recordarà l'olor de pluja.
I ens tornarem a mullar
si no desem els nostres noms
al calaix secret del claustre.""",
        "ordre_parada": 8,
    },
    {
        "autora_nom": "Maria Aurèlia Capmany i Farnés",
        "titol": "L'altra ciutat II",
        "obra_origen": "L'altra ciutat, 1955",
        "contingut": """L'aire tancat dins les arcades, a penes aclarit pels raigs de colors que es llençaven de molt amunt, fins a les lloses sepulcrals, era gelat, agradable, com una carícia perceptible.

Una olor d'humitat la feu respirar, profundament.

Aixecà els ulls enlaire i després anà baixant a poc a poc, molt a poc a poc, per la gran columna que el benestar del descens, resseguint amb delícia la cobra de l'arc, lliscant la mirada per la canal enfosquida, per la pols, pels anys, fins a arribar al sòcol.

Tots els passos fregaven les pedres del sòl amb brogit de processó.

Davant de l'altar major s'agenollaven. No hi havia el Sagrament, però d'esma s'agenollà també reverenciant el buit i el silenci de l'altar.

Genolls en terra sentí la frescor de les pedres i clavar-se en la ròtula el relleu d'un sepulcre.

L'altar del Sagrament brillava. Tremolaven indecises les flames dels ciris. De tant en tant, invisible, inversemblant, un alè d'aire les colltorçava totes amb ordenat gest de dansa.

L'orgue sonava i omplia la nau d'un efluvi de solemnitat i tendresa.

Les veus de l'orgue, l'olor de l'encens, la lluminositat roja, estriada, dels ciris, anava rodejant-la, amb ones concèntriques d'emoció, quasi fins a arribar al fons d'ella mateixa, quasi posseint-la del tot.""",
        "ordre_parada": 8,
    },
    {
        "autora_nom": "Montserrat Palau i Vergés",
        "titol": "En nom del pare III",
        "obra_origen": "En nom del pare, 1999",
        "contingut": """Era el moment d'aquelles reflexions que tantes vegades havia llegit. No era dir el que pensava, sinó tenir feina per pensar el que deia. Però enlloc d'enaiguar-m'hi més, vaig decidir menjar alguna cosa. Vaig caminar sense rumb concret. Uns magribins la feien petar en una cantonada.

Vaig comprovar que els escenaris de la infantesa i l'adolescència havien canviat a mitges, diferents o iguals. Carrers enrajolats, zones de vianants, botigues llèpoles i edificis restaurats eren les cares d'una moneda amb creus deixades de la mà de déu, lumpen i brutícia. Enllumenat de disseny i roba estesa i bombones de butà en uns balcons que deixaven sortir la veu de la tele a tot volum o on un home jaio amb samarreta imperi fumava un caliquenyo. Vaig anar baixant pel Carrer Major fins a la Plaça de l'Ajuntament, tota guarnida de festa major.

El paisatge urbà havia canviat en part. Com els restaurants i bars. Ho vaig notar mentre cercava algun lloc que m'abellís perquè tenia temps i havia decidit seure una estoneta. Encara recordava la novetat del primer frankfurt que es va instal·lar a la ciutat. I, després, la primera pizzeria. Exotismes enmig d'uniformitat sense gaires vel·leïtats, sense excessos.""",
        "ordre_parada": 9,
    },
    {
        "autora_nom": "Mònica Batet i Boada",
        "titol": "L'habitació grisa IV",
        "obra_origen": "L'habitació grisa, 2006",
        "contingut": """Tot i que no l'havia vist més, sabia que aquella tarda ell seria a Tarragona. A un quart de vuit va decidir donar cinc minuts més a la pluja: si continuava se n'aniria cap a casa, tornaria amb l'Emma i els Guinovart, i s'oblidaria de tot allò per sempre; però si deixava de ploure seria valenta i se n'aniria fins a Tarragona per esperar-lo.

No va ser difícil per a ella mentir: tenia reunions, baixava a Tarragona per veure la tieta Teresa, anava al metge; feia milers de coses i ningú li feia preguntes.

Setmanes després tornava a Tarragona fascinada per un home amb qui no havia intercanviat més de tres paraules seguides. Va passar el temps i un dia es van trobar prop de la catedral, va convidar-la a prendre un cafè i va parlar-li d'un poeta català que escrivia uns sonets complicadíssims. I ella, més fascinada encara.

La primera vegada que el va deixar va voler creure que aquella era la millor decisió que mai havia pres, però mesos després enyorava la veu pausada del Miquel Guinovart i perdia les tardes al carrer Major.

Després d'una nit d'insomni, va decidir quedar-se a Tarragona aquell dia, perquè de cap manera volia acceptar que el Miquel ja no hi era.

Si no hagués estat perquè el seu home hauria fet massa preguntes, se n'hauria anat a Tarragona a fer-li companyia, però s'havia hagut de quedar a Mir i conformar-se a sentir la veu buida de la seva germana cada nit per telèfon.""",
        "ordre_parada": 9,
    },
    {
        "autora_nom": "Montserrat Abelló i Soler",
        "titol": "No hem parlat de res",
        "obra_origen": "L'esfera del temps, 1998",
        "contingut": """No hem parlat de res,
ens hem assegut mirant-nos.

La primavera era
un espai somort vora un estiu
que tot just començava.

No hem parlat de res.

La maduresa dels nostres esguards
era ben plena de paraules.""",
        "ordre_parada": 10,
    },
    {
        "autora_nom": "Mònica Batet i Boada",
        "titol": "L'habitació grisa VI",
        "obra_origen": "L'habitació grisa, 2006",
        "contingut": """Per això quan va començar a estudiar Filologia Catalana a Tarragona va dir al seu pare que li agradaria viure a casa de la tieta Teresa durant els dies de cada dia, i d'aquesta manera no caldria que s'aixequés tan aviat als matins.

Ara que ja no havia d'entrar al Conservatori li agradava passar pel carrer Cavallers, baixar pel carrer Major i asseure's en algun bar de la Plaça de la Font per contemplar com la gent anava i venia. Va ser allí on va tornar a veure el seu professor de piano. El Rafel primer no la va reconèixer, però després va posar temps a la seva cara i quan es van trobar al carrer Major va alentir el pas per poder-hi parlar.

A Tarragona la Laura s'hi sentia millor que en qualsevol altra banda. La seva tieta vivia en un pis gran, una mica fred a l'hivern i ple de sol quan el març canviava l'hora. Però el que més li agradava del pis de la Teresa era que no hi tenia ni un sol rellotge.""",
        "ordre_parada": 10,
    },
]

def seed():
    db = SessionLocal()
    existing = db.query(Text).count()
    if existing > 0:
        print(f"Ja existeixen {existing} textos. Netejant...")
        db.query(Like).delete()
        db.query(Text).delete()
        db.commit()

    parades = db.query(Parada).order_by(Parada.ordre).all()
    parada_per_ordre = {p.ordre: p for p in parades}

    def find_autora(nom_complet: str) -> Autora | None:
        nom, cognom = partir_nom(nom_complet.strip())
        if not cognom:
            return None
        return db.query(Autora).filter(
            Autora.nom == nom,
            Autora.cognom == cognom,
        ).first()

    created = 0
    errors = []
    for item in TEXTOS_DATA:
        parada = parada_per_ordre.get(item["ordre_parada"])
        if not parada:
            errors.append(f"Parada ordre {item['ordre_parada']} no trobada")
            continue
        autora = find_autora(item["autora_nom"])
        if not autora:
            errors.append(f"Autora '{item['autora_nom']}' no trobada")
            continue
        text = Text(
            titol=item["titol"],
            obra_origen=item["obra_origen"],
            contingut=item["contingut"],
            parada_id=parada.id,
            autora_id=autora.id,
        )
        db.add(text)
        created += 1

    db.commit()
    total_parades = len(parades)
    print(f"Creats {created} textos a {total_parades} parades")
    if errors:
        for e in errors:
            print(f"  ERROR: {e}")
    db.close()

if __name__ == "__main__":
    seed()
