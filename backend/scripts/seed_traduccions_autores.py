"""Biografies de les tretze autores en castellà i anglès.

No són una traducció de les biografies catalanes del web del projecte: són
textos nous escrits a partir dels mateixos fets. La distinció importa. Els
fets biogràfics -on va néixer algú, què va publicar, quin premi va guanyar-
no tenen drets d'autor; només en té l'expressió concreta amb què s'expliquen.
Reescriure'ls és legítim, calcar la prosa d'un altre no.

Amb els textos literaris no es pot fer això, i per això no es fa: allí el
valor és justament l'expressió, i traduir-la seria crear obra derivada sense
tenir-ne el dret.

Les autores es busquen per nom i cognom, de manera que el seed es pot tornar
a executar després d'un scraping.

Ús:
    venv/Scripts/python.exe scripts/seed_traduccions_autores.py
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.autora import Autora
from app.models.autora_traduccio import AutoraTraduccio
from app.models.usuari import Idioma

BIOGRAFIES = {
    ("Montserrat", "Abelló i Soler"): {
        "ES": (
            "Poeta y traductora, una de las voces esenciales de la poesía catalana "
            "contemporánea. Nacida en la calle Apodaca de Tarragona, pasó la infancia "
            "entre Cádiz, Londres y Cartagena siguiendo el trabajo de su padre, "
            "ingeniero naval. Durante la Guerra Civil enseñó inglés en Barcelona e "
            "hizo de intérprete para miembros de las Brigadas Internacionales. En 1939 "
            "se exilió a Francia, después a Inglaterra y finalmente a Chile, donde "
            "vivió veinte años y conoció a Domènec Guansé, Joan Oliver y Pablo Neruda. "
            "Regresó a Barcelona en 1960."
        ),
        "EN": (
            "Poet and translator, one of the essential voices of contemporary Catalan "
            "poetry. Born in Carrer Apodaca in Tarragona, she spent her childhood "
            "between Cádiz, London and Cartagena, following her father's work as a "
            "naval engineer. During the Spanish Civil War she taught English in "
            "Barcelona and interpreted for members of the International Brigades. In "
            "1939 she went into exile in France, then England, and finally Chile, "
            "where she lived for twenty years and met Domènec Guansé, Joan Oliver and "
            "Pablo Neruda. She returned to Barcelona in 1960."
        ),
    },
    ("Margarida", "Aritzeta i Abad"): {
        "ES": (
            "Nació en Valls en 1953. Estudió Magisterio en Tarragona e Historia Moderna "
            "y Contemporánea y Filología Catalana en la Universidad de Barcelona, donde "
            "se doctoró. Debutó con el premio Víctor Català de cuentos y narraciones "
            "(1980) y el premio Sant Joan de novela (1983). Ha publicado más de cuarenta "
            "obras: veinte novelas, dos volúmenes de relatos, trece novelas juveniles y "
            "numerosos trabajos de investigación y crítica literaria. En 2013 recibió el "
            "Premio Barcanova de literatura infantil y juvenil por El vol de la "
            "papallona. Destaca también como autora de novela negra y de ciencia ficción."
        ),
        "EN": (
            "Born in Valls in 1953. She studied teaching in Tarragona, and Modern and "
            "Contemporary History and Catalan Philology at the University of Barcelona, "
            "where she completed her doctorate. She made her debut with the Víctor "
            "Català prize for short fiction (1980) and the Sant Joan novel prize (1983). "
            "She has published more than forty books: twenty novels, two short story "
            "collections, thirteen novels for young readers and a great deal of research "
            "and literary criticism. In 2013 she won the Barcanova prize for children's "
            "and young adult literature with El vol de la papallona. She is also known "
            "for her crime and science fiction writing."
        ),
    },
    ("Maria Aurèlia", "Capmany i Farnés"): {
        "ES": (
            "Escritora barcelonesa polifacética: novelista, traductora, dramaturga y "
            "ensayista. Estudió en el Institut Escola de la Generalitat de Catalunya y "
            "se licenció en Filosofía en la Universidad de Barcelona. Fue profesora en "
            "el Institut Albéniz de Badalona y en la Escola Isabel de Villena de "
            "Barcelona. Su primera novela, Necessitem morir (1952), quedó finalista del "
            "Premio Joanot Martorell de 1947, que ganó en 1948 con El cel no és "
            "transparent. Con Un lloc entre els morts obtuvo el Premio Sant Jordi de "
            "1968. Su obra abarca también ensayo feminista, literatura juvenil y libros "
            "de memorias."
        ),
        "EN": (
            "A versatile Barcelona writer: novelist, translator, playwright and "
            "essayist. She studied at the Institut Escola de la Generalitat de Catalunya "
            "and graduated in Philosophy from the University of Barcelona. She taught at "
            "the Institut Albéniz in Badalona and the Escola Isabel de Villena in "
            "Barcelona. Her first novel, Necessitem morir (1952), was a finalist for the "
            "1947 Joanot Martorell prize, which she won in 1948 with El cel no és "
            "transparent. Un lloc entre els morts earned her the 1968 Sant Jordi prize. "
            "Her work also includes feminist essays, writing for young readers and "
            "memoirs."
        ),
    },
    ("Noemi", "Bagés i Fortacín"): {
        "ES": (
            "Nació en 1974 en Fráncfort (Alemania), donde sus padres, originarios de "
            "Flix (Ribera d'Ebre), vivieron quince años. La familia se instaló en "
            "Tarragona cuando ella tenía dos años. Filóloga catalana, es profesora de "
            "lengua catalana y literatura desde 1997, profesión que compagina con la "
            "creación literaria y con la elaboración de material didáctico sobre "
            "literatura universal para el Departamento de Educación. Ha sido jurado de "
            "varios premios literarios y ha realizado estudios de sociolingüística y "
            "dialectología."
        ),
        "EN": (
            "Born in 1974 in Frankfurt, Germany, where her parents — from Flix, in the "
            "Ribera d'Ebre — lived for fifteen years. The family settled in Tarragona "
            "when she was two. A Catalan philologist, she has taught Catalan language "
            "and literature since 1997, combining teaching with her own writing and with "
            "producing teaching material on world literature for the Catalan education "
            "department. She has sat on the juries of several literary prizes and has "
            "carried out research in sociolinguistics and dialectology."
        ),
    },
    ("Mònica", "Batet i Boada"): {
        "ES": (
            "Escritora de ficción y editora de Nits Blanques Edicions. Estudió Filología "
            "Catalana en la Universitat Rovira i Virgili. Ha publicado cinco novelas y un "
            "volumen de relatos. Con su primera novela, L'habitació grisa (Empúries, "
            "2006), ganó el Premio de novela corta Just Manuel Casero; con No et miris el "
            "Riu (Meteora, 2012) fue finalista del Premio Crexells, y con Nou illes al "
            "nord (Més Llibres, 2019) obtuvo el Premio Nollegiu. En 2021 recibió una beca "
            "Montserrat Roig. Algunos de sus cuentos se han traducido al inglés, el "
            "español, el polaco y el griego."
        ),
        "EN": (
            "A fiction writer and editor at Nits Blanques Edicions. She studied Catalan "
            "Philology at the Universitat Rovira i Virgili. She has published five novels "
            "and a collection of short stories. Her first novel, L'habitació grisa "
            "(Empúries, 2006), won the Just Manuel Casero short novel prize; No et miris "
            "el Riu (Meteora, 2012) was a finalist for the Crexells prize, and Nou illes "
            "al nord (Més Llibres, 2019) won the Nollegiu prize. In 2021 she received a "
            "Montserrat Roig grant. Some of her stories have been translated into "
            "English, Spanish, Polish and Greek."
        ),
    },
    ("Maria", "Domènech i Escoté"): {
        "ES": (
            "Nació en Alcover en 1877 y vivió en Tarragona durante su juventud. Escritora "
            "polifacética, cultivó la narración, la poesía, el ensayo y el teatro, y "
            "también se dedicó a la pintura. Activista en la línea del feminismo "
            "conservador de finales del siglo XIX y principios del XX, fundó en 1912 la "
            "Federació Sindical d'Obreres. Sus artículos en la revista Feminal tuvieron "
            "gran repercusión, y publicó también en diarios y semanarios como La Pàtria, "
            "Lo Camp de Tarragona, El Poble Català y La Veu de Catalunya. Murió en 1952."
        ),
        "EN": (
            "Born in Alcover in 1877, she lived in Tarragona during her youth. A "
            "versatile writer, she worked in fiction, poetry, essays and drama, and was "
            "also a painter. An activist in the conservative feminism of the late "
            "nineteenth and early twentieth centuries, in 1912 she founded the Federació "
            "Sindical d'Obreres, a women workers' union. Her articles in the magazine "
            "Feminal were widely read, and she also wrote for newspapers and weeklies "
            "such as La Pàtria, Lo Camp de Tarragona, El Poble Català and La Veu de "
            "Catalunya. She died in 1952."
        ),
    },
    ("Roser", "Guasch i Bea"): {
        "ES": (
            "Nació en Les Masies de Sant Miquel, Banyeres del Penedès, en 1969. Dice que "
            "escribe desde que aprendió a hacerlo, porque le gustaban las palabras y los "
            "sonidos que hacían. Estudió Filología Catalana y dos cursos de doctorado en "
            "lenguajes narrativos en la Universitat Rovira i Virgili. Vive en Tarragona y "
            "es profesora de lengua y literatura catalanas en el Institut Tarragona. Ha "
            "escrito narrativa, artículos de opinión y ensayo literario, pero sobre todo "
            "poesía, y ha desarrollado proyectos junto a autores de otras disciplinas "
            "como la fotografía, la pintura y la música."
        ),
        "EN": (
            "Born in Les Masies de Sant Miquel, Banyeres del Penedès, in 1969. She says "
            "she has written since she first learned how, because she liked words and the "
            "sounds they made. She studied Catalan Philology and two years of doctoral "
            "work in narrative languages at the Universitat Rovira i Virgili. She lives in "
            "Tarragona and teaches Catalan language and literature at the Institut "
            "Tarragona. She has written fiction, opinion pieces and literary essays, but "
            "above all poetry, and has worked on projects with artists from other fields "
            "such as photography, painting and music."
        ),
    },
    ("Lurdes", "Malgrat i Escarp"): {
        "ES": (
            "Nació en Lleida en 1969. Licenciada en Filología Catalana, fundó y dirigió "
            "la Escola de Lletres de Tarragona desde su creación en 2002, y colabora "
            "ocasionalmente en medios de comunicación. En agosto de 2021 fue nombrada "
            "directora de los Servicios Territoriales de Cultura de la Generalitat en "
            "Tarragona. Ha publicado los libros de poesía Amat (2005), Terra fonda (2008) "
            "y Senyals a la costa (2016), además de poemas en prosa. Ha traducido al "
            "catalán obras teatrales de Juan Mayorga, Raúl Hernández, Luis Miguel "
            "González, Juan Pablo Vallejo, José Luis Arce y Antonio Álamo."
        ),
        "EN": (
            "Born in Lleida in 1969. A graduate in Catalan Philology, she founded and "
            "directed the Escola de Lletres in Tarragona from its creation in 2002, and "
            "contributes occasionally to the media. In August 2021 she was appointed "
            "director of the Catalan government's regional culture service in Tarragona. "
            "She has published the poetry collections Amat (2005), Terra fonda (2008) and "
            "Senyals a la costa (2016), as well as prose poems. She has translated plays "
            "into Catalan by Juan Mayorga, Raúl Hernández, Luis Miguel González, Juan "
            "Pablo Vallejo, José Luis Arce and Antonio Álamo."
        ),
    },
    ("Josepa", "Massanés i Dalmau"): {
        "ES": (
            "Nació en 1811 en la calle dels Calderers de Tarragona. A los dos meses su "
            "familia se trasladó a Barcelona y a los cinco años quedó huérfana de madre, "
            "por lo que creció con sus abuelos paternos. De formación autodidacta, "
            "estudió latín, italiano, francés y los autores clásicos. En 1837 su poema "
            "«El beso maternal», traducido al inglés, fue recomendado a los centros "
            "educativos de Nueva York por la comisión de instrucción pública de la "
            "ciudad. Empezó escribiendo en castellano y en 1841 publicó su primer libro, "
            "Poesías: fue la primera poeta romántica en publicar un libro. En los años "
            "cincuenta inició su producción en catalán y se convirtió en la primera "
            "escritora de la Renaixença. Su obra poética catalana se recogió "
            "póstumamente en Poesies (1908), con prólogo de Dolors Monserdà."
        ),
        "EN": (
            "Born in 1811 in Carrer dels Calderers in Tarragona. Her family moved to "
            "Barcelona when she was two months old, and she lost her mother at the age of "
            "five, growing up with her paternal grandparents. Self-taught, she studied "
            "Latin, Italian, French and the classical authors. In 1837 her poem \"El beso "
            "maternal\", translated into English, was recommended to New York schools by "
            "the city's public instruction board. She began writing in Spanish and "
            "published her first book, Poesías, in 1841, becoming the first Romantic "
            "woman poet to publish a book. In the 1850s she began writing in Catalan and "
            "became the first woman writer of the Renaixença. Her Catalan poetry was "
            "collected posthumously in Poesies (1908), with a preface by Dolors Monserdà."
        ),
    },
    ("Cinta", "Mulet i Grau"): {
        "ES": (
            "Nació en Horta de Sant Joan en 1958 y vive entre Tarragona y su pueblo "
            "natal. Empezó publicando narraciones en Cavall Fort, pero su inclinación "
            "natural la llevó a la poesía. Es autora de La saviesa de l'ombra (1999), "
            "Paraula de dona (2001), Poemes del sud (2004), Versets per a cantar a un "
            "poble (2004) y Poemes, pomes i altres verins (2005), entre otros. Ha "
            "publicado también el monólogo de poesía escénica Qui ha mort una poeta "
            "(2007), el libro de poesía infantil Aigua dolça (2007) y Només un fil de "
            "llum blanca (2011). Sus últimos trabajos son A la llar de mi (2015) y la "
            "adaptación teatral del Llibre de les Bèsties (2015)."
        ),
        "EN": (
            "Born in Horta de Sant Joan in 1958, she divides her time between Tarragona "
            "and her home village. She began by publishing short stories in Cavall Fort, "
            "but her natural inclination led her to poetry. She is the author of La "
            "saviesa de l'ombra (1999), Paraula de dona (2001), Poemes del sud (2004), "
            "Versets per a cantar a un poble (2004) and Poemes, pomes i altres verins "
            "(2005), among others. She has also published the staged poetry monologue Qui "
            "ha mort una poeta (2007), the children's poetry book Aigua dolça (2007) and "
            "Només un fil de llum blanca (2011). Her most recent works are A la llar de mi "
            "(2015) and a school theatre adaptation of the Llibre de les Bèsties (2015)."
        ),
    },
    ("Isabel", "Ortega i Rion"): {
        "ES": (
            "Escritora tarraconense nacida en 1955. Ha trabajado como profesora de lengua "
            "catalana y literatura en el Institut Esteve Terradas de Cornellà de "
            "Llobregat. Licenciada en Psicología y en Filosofía, ha colaborado en el "
            "seminario Filosofía y Género de la Universidad de Barcelona investigando la "
            "obra de Simone Weil, de quien tradujo Escrits sobre la guerra (1997). En 1994 "
            "publicó la novela Viatge d'anada. En poesía ha publicado Enfilall (XXII "
            "Premio Comas i Maduell Ciutat de Tarragona, 2002), Runa plena (2004), Nòmada "
            "(2009), Medusa (2013) y Cues de sargantana (2019)."
        ),
        "EN": (
            "A writer from Tarragona, born in 1955. She has taught Catalan language and "
            "literature at the Institut Esteve Terradas in Cornellà de Llobregat. A "
            "graduate in Psychology and Philosophy, she has taken part in the Philosophy "
            "and Gender seminar at the University of Barcelona, researching the work of "
            "Simone Weil, whose Escrits sobre la guerra she translated in 1997. In 1994 "
            "she published the novel Viatge d'anada. Her poetry includes Enfilall (22nd "
            "Comas i Maduell Ciutat de Tarragona prize, 2002), Runa plena (2004), Nòmada "
            "(2009), Medusa (2013) and Cues de sargantana (2019)."
        ),
    },
    ("Montserrat", "Palau i Vergés"): {
        "ES": (
            "Nació en Tarragona en 1958. Es profesora de literatura catalana en la "
            "Universitat Rovira i Virgili e imparte docencia en el Institut "
            "Interuniversitari d'Estudis de Dones i Gènere. Su trayectoria literaria "
            "destaca por la diversidad de géneros: ha publicado el poemario Just a dream "
            "(1989), las novelas Interferències (1989), Suspíria (1994), Sapore di sale "
            "(1996) y En nom del pare (1999), y el volumen de relatos Cadires confortables "
            "(1990)."
        ),
        "EN": (
            "Born in Tarragona in 1958. She teaches Catalan literature at the Universitat "
            "Rovira i Virgili and also lectures at the inter-university institute for "
            "women's and gender studies. Her literary work stands out for its range of "
            "genres: the poetry collection Just a dream (1989), the novels Interferències "
            "(1989), Suspíria (1994), Sapore di sale (1996) and En nom del pare (1999), "
            "and the short story collection Cadires confortables (1990)."
        ),
    },
    ("Olga", "Xirinacs i Díaz"): {
        "ES": (
            "Nació en Tarragona en 1936. Autora de una extensísima obra en verso y en "
            "prosa, empezó a publicar en 1976 con el poemario La dotzena de frare y ha "
            "continuado hasta hoy, con Una bomba al jardí (2021) y Blaumarí (2022). Entre "
            "sus títulos destacan Interior amb difunts (Premio Josep Pla, 1982), Al meu "
            "cap una llosa (Premios Sant Jordi, 1984, y Crítica Serra d'Or, 1986), Zona "
            "marítima (Premio Ramon Llull, 1986), Llavis que dansen (Premio Carles Riba, "
            "1987) y Enterraments lleugers (Premio Sant Joan, 1990). Es la única mujer "
            "nombrada Mestra en Gai Saber en los Jocs Florals de Barcelona después de "
            "Mercè Rodoreda, y en 1990 recibió la Creu de Sant Jordi."
        ),
        "EN": (
            "Born in Tarragona in 1936. The author of a vast body of work in verse and "
            "prose, she began publishing in 1976 with the poetry collection La dotzena de "
            "frare and has continued to the present day with Una bomba al jardí (2021) and "
            "Blaumarí (2022). Her best known titles include Interior amb difunts (Josep "
            "Pla prize, 1982), Al meu cap una llosa (Sant Jordi prize, 1984, and Serra "
            "d'Or Critics' prize, 1986), Zona marítima (Ramon Llull prize, 1986), Llavis "
            "que dansen (Carles Riba prize, 1987) and Enterraments lleugers (Sant Joan "
            "prize, 1990). She is the only woman named Mestra en Gai Saber at the "
            "Barcelona Jocs Florals since Mercè Rodoreda, and in 1990 she received the "
            "Creu de Sant Jordi."
        ),
    },
}


def seed():
    db = SessionLocal()
    desades = 0
    no_trobades = []

    try:
        for (nom, cognom), per_idioma in BIOGRAFIES.items():
            autora = db.query(Autora).filter(
                Autora.nom == nom, Autora.cognom == cognom
            ).first()

            if not autora:
                no_trobades.append(f"{nom} {cognom}")
                continue

            for codi, bio in per_idioma.items():
                idioma = Idioma(codi)
                traduccio = db.query(AutoraTraduccio).filter(
                    AutoraTraduccio.autora_id == autora.id,
                    AutoraTraduccio.idioma == idioma,
                ).first()

                if traduccio:
                    setattr(traduccio, "bio", bio)
                else:
                    db.add(
                        AutoraTraduccio(autora_id=autora.id, idioma=idioma, bio=bio)
                    )
                desades += 1

            print(f"  V {nom} {cognom} (ES, EN)")

        db.commit()
        print(f"\n{desades} biografies desades.")

        if no_trobades:
            print("\nAVIS: no s'han trobat aquestes autores a la base de dades.")
            print("Si els noms han canviat, cal actualitzar-los en aquest script:")
            for nom in no_trobades:
                print(f"  - {nom}")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
