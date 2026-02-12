import React from 'react';
import Header from '../components/Header';
import '../styles/cgv.scss';

const CGV = () => {
    return (
        <div className="layout">
            <Header />
            <div className="cgv-page">
                <div className="cgv-container">
                    <h1>CONDITIONS GÉNÉRALES DE VENTE</h1>
                    
                    <div className="header-info">
                        <p><strong>ÉTABLISSEMENTS GUÉGAN</strong></p>
                        <p>SAS au capital de 525 500,00 €</p>
                        <p>Siège social : 1 rue de l'Industrie, 93000 Bobigny</p>
                        <p>RCS Bobigny 785 583 527 — TVA FR 84 785 583 527</p>
                        <p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                        <p>Site internet : https://www.etsguegan.com/</p>
                        <p>Applicables à compter du [DATE]</p>
                        <p>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</p>
                    </div>

                    <section>
                        <h2>ARTICLE 1 — DÉFINITIONS</h2>
                        <p>Dans les présentes Conditions Générales de Vente (ci-après « CGV »), les termes suivants ont la signification qui leur est attribuée ci-dessous :</p>
                        <ul>
                            <li><strong>« Vendeur »</strong> : désigne la société ÉTABLISSEMENTS GUÉGAN, SAS au capital de 525 500,00 €, immatriculée au RCS de Bobigny sous le numéro 785 583 527, dont le siège social est situé 1 rue de l'Industrie, 93000 Bobigny, numéro de TVA intracommunautaire FR 84 785 583 527.</li>
                            <li><strong>« Site »</strong> : désigne le site internet [À COMPLÉTER — nom de domaine] exploité par le Vendeur.</li>
                            <li><strong>« Client »</strong> : désigne toute personne physique ou morale qui passe commande sur le Site, qu'elle agisse en qualité de consommateur au sens de l'article liminaire du Code de la consommation ou en qualité de professionnel.</li>
                            <li><strong>« Consommateur »</strong> : désigne tout Client personne physique qui agit à des fins qui n'entrent pas dans le cadre de son activité commerciale, industrielle, artisanale, libérale ou agricole.</li>
                            <li><strong>« Client Professionnel »</strong> : désigne tout Client personne physique ou morale, publique ou privée, qui agit à des fins entrant dans le cadre de son activité commerciale, industrielle, artisanale, libérale ou agricole.</li>
                            <li><strong>« Produit(s) »</strong> : désigne les plans de travail en résine blanche fabriqués sur mesure, selon les spécifications du Client, proposés à la vente sur le Site.</li>
                            <li><strong>« Configurateur »</strong> : désigne l'outil de configuration en ligne mis à la disposition du Client sur le Site, permettant de définir les caractéristiques du Produit (dimensions, découpes, perçages, options).</li>
                            <li><strong>« Commande »</strong> : désigne l'acte par lequel le Client valide les caractéristiques du Produit configuré et procède à son paiement intégral sur le Site.</li>
                        </ul>
                    </section>

                    <section>
                        <h2>ARTICLE 2 — OBJET ET CHAMP D'APPLICATION</h2>
                        <p>Les présentes CGV régissent l'ensemble des ventes de Produits réalisées par le Vendeur auprès des Clients via le Site.</p>
                        <p>Elles s'appliquent à toute Commande passée sur le Site, que le Client agisse en qualité de Consommateur ou de Client Professionnel.</p>
                        <p>Toute Commande implique l'acceptation sans réserve par le Client des présentes CGV, lesquelles prévalent sur tout autre document, et notamment sur toutes conditions générales d'achat du Client, sauf accord écrit et exprès du Vendeur.</p>
                        <p>Le Vendeur se réserve le droit de modifier les présentes CGV à tout moment.</p>
                        <p>Les CGV applicables à une Commande sont celles en vigueur à la date de passation de ladite Commande.</p>
                        <p>Le Site est destiné à une clientèle située en France métropolitaine. Les Produits ne sont livrés qu'en France métropolitaine.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 3 — PRODUITS — CARACTÈRE SUR MESURE</h2>
                        <h3>3.1. Description des Produits</h3>
                        <p>Le Vendeur propose à la vente, exclusivement via le Site, des plans de travail en résine blanche entièrement fabriqués sur mesure.</p>
                        <p>Chaque Produit est confectionné selon les spécifications fournies par le Client au moyen du Configurateur.</p>
                        <p>Les éléments personnalisables par le Client comprennent notamment : les dimensions (longueur, largeur, épaisseur), les découpes, les perçages (trou de robinetterie), les retombées, le dosseret, la goutte d'eau, ainsi que toute autre option proposée sur le Configurateur.</p>
                        
                        <h3>3.2. Caractère sur mesure</h3>
                        <p>Tous les Produits proposés sur le Site sont des biens confectionnés selon les spécifications du Client ou nettement personnalisés au sens de l'article L. 221-28, 3° du Code de la consommation.</p>
                        <p>Aucun Produit standard ou de série n'est proposé à la vente.</p>
                        <p>Les conséquences de ce caractère sur mesure, notamment en ce qui concerne le droit de rétractation, sont détaillées à l'article 9 des présentes.</p>
                        
                        <h3>3.3. Visuels et informations</h3>
                        <p>Les photographies, illustrations et descriptions figurant sur le Site sont présentées à titre indicatif et ne sont pas contractuelles.</p>
                        <p>Seules les caractéristiques issues de la configuration validée par le Client et figurant sur le récapitulatif de Commande sont contractuelles.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 4 — COMPTE CLIENT</h2>
                        <p>La passation d'une Commande sur le Site est subordonnée à la création préalable d'un compte Client.</p>
                        <p>Le Client s'engage à fournir des informations exactes, complètes et à jour lors de la création de son compte et à les maintenir actualisées.</p>
                        <p>Le Client est seul responsable de la confidentialité de ses identifiants de connexion.</p>
                        <p>Toute Commande passée à l'aide des identifiants du Client est réputée avoir été passée par lui.</p>
                        <p>Le Vendeur se réserve le droit de suspendre ou de supprimer tout compte Client en cas de manquement aux présentes CGV ou d'utilisation frauduleuse.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 5 — PROCESSUS DE COMMANDE ET FORMATION DU CONTRAT</h2>
                        <h3>5.1. Étapes de la Commande</h3>
                        <p>Le processus de commande se déroule selon les étapes suivantes :</p>
                        <p>(a) Le Client configure son Produit au moyen du Configurateur en renseignant les dimensions, découpes, perçages et options souhaitées.</p>
                        <p>Le Client est seul responsable de l'exactitude des mesures et spécifications qu'il renseigne.</p>
                        <p>(b) Un récapitulatif de Commande est affiché, présentant les caractéristiques détaillées du Produit, le prix total TTC (et HT), les délais indicatifs de fabrication et de livraison.</p>
                        <p>(c) Le Client vérifie le récapitulatif, accepte les présentes CGV en cochant la case prévue à cet effet et reconnaît expressément, par une case à cocher spécifique, que le Produit est fabriqué sur mesure selon ses spécifications et qu'il ne bénéficie pas du droit de rétractation prévu aux articles L. 221-18 et suivants du Code de la consommation.</p>
                        <p>(d) Le Client procède au paiement intégral de la Commande en cliquant sur le bouton « Commande avec obligation de paiement » ou toute formule équivalente non ambiguë.</p>
                        <p>(e) Le Vendeur adresse au Client, par courrier électronique, un accusé de réception de la Commande reprenant l'ensemble des caractéristiques du Produit et le montant payé.</p>
                        
                        <h3>5.2. Formation du contrat</h3>
                        <p>Le contrat de vente est réputé conclu à la date d’envoi par les ÉTABLISSEMENTS GUÉGAN d’un courriel de confirmation de la Commande récapitulant les caractéristiques essentielles du Produit, le prix total payé et les délais indicatifs de fabrication et de livraison.</p>
                        <p>Dès la formation du contrat, la Commande est ferme et définitive.</p>
                        <p>Le Client ne peut ni modifier, ni annuler sa Commande, sauf dans les cas prévus par la loi (notamment en cas de défaut de conformité, de vice caché ou de manquement du Vendeur à ses obligations).</p>
                        
                        <h3>5.3. Responsabilité du Client quant aux spécifications</h3>
                        <p>Le Client reconnaît être seul responsable des dimensions, cotes, perçages, découpes et options qu'il renseigne dans le Configurateur.</p>
                        <p>Le Vendeur fabrique le Produit conformément aux spécifications validées par le Client et ne saurait être tenu responsable d'une erreur imputable au Client dans la saisie de ces spécifications.</p>
                        <p>Il est vivement recommandé au Client de vérifier avec la plus grande attention l'ensemble des spécifications figurant sur le récapitulatif de Commande avant de procéder au paiement.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 6 — PRIX ET MODALITÉS DE PAIEMENT</h2>
                        <h3>6.1. Prix</h3>
                        <p>Les prix des Produits sont exprimés en euros, toutes taxes comprises (TTC) et hors taxes (HT).</p>
                        <p>Le prix est calculé automatiquement par le Configurateur en fonction des dimensions, options et spécifications choisies par le Client.</p>
                        <p>Le prix comprend la fabrication, l'emballage et la livraison du Produit en France métropolitaine, sauf mention contraire au moment de la Commande.</p>
                        <p>Le Vendeur se réserve le droit de modifier ses prix à tout moment.</p>
                        <p>Les Produits sont facturés sur la base des prix en vigueur au moment de la validation de la Commande.</p>
                        
                        <h3>6.2. Modalités de paiement</h3>
                        <p>Le paiement s'effectue intégralement à la Commande, par carte bancaire ou par virement bancaire, via le prestataire de paiement sécurisé [À COMPLÉTER — prestataire de paiement].</p>
                        <p>La Commande n’est définitivement prise en compte et mise en fabrication qu’après encaissement effectif de l’intégralité du prix.</p>
                        
                        <h3>6.3. Incident de paiement</h3>
                        <p>En cas de refus de paiement ou d'incident de paiement, la Commande est suspendue pendant un délai de cinq (5) jours ouvrés à compter de la notification du refus adressée au Client, sans que le Client puisse prétendre à une quelconque indemnité.</p>
                        <p>À l'expiration de ce délai, et à défaut de régularisation, la Commande est automatiquement annulée de plein droit, sans préjudice de tout dommage et intérêt que le Vendeur pourrait réclamer.</p>
                        
                        <h3>6.4. Facturation</h3>
                        <p>Une facture est adressée au Client par courrier électronique à la suite de la Commande.</p>
                        <p>Le Client peut consulter et télécharger ses factures depuis son espace Client.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 7 — FABRICATION ET DÉLAIS</h2>
                        <h3>7.1. Délais de fabrication</h3>
                        <p>Les délais de fabrication sont indicatifs et dépendent de la charge de travail de l'atelier du Vendeur.</p>
                        <p>Ils sont communiqués au Client lors du processus de commande et actualisés régulièrement sur le Site.</p>
                        <p>Le Vendeur s'engage à informer le Client dans les meilleurs délais de tout retard prévisible dans la fabrication de son Produit.</p>
                        
                        <h3>7.2. Retard de fabrication</h3>
                        <p>En cas de retard significatif de fabrication, le Client en sera informé par courrier électronique.</p>
                        <p>Ce retard ne saurait donner lieu à l'annulation de la Commande sauf dans les conditions prévues par l'article L. 216-2 du Code de la consommation, c'est-à-dire lorsque le Client Consommateur a, préalablement à la Commande, fait de la date ou du délai de livraison une condition essentielle du contrat, ou lorsque le retard excède un délai raisonnable après mise en demeure restée infructueuse.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 8 — LIVRAISON ET TRANSFERT DES RISQUES</h2>
                        <h3>8.1. Zone de livraison</h3>
                        <p>Les Produits sont livrés exclusivement en France métropolitaine, à l'adresse de livraison indiquée par le Client lors de la Commande (domicile ou chantier).</p>
                        
                        <h3>8.2. Modalités de livraison</h3>
                        <p>La livraison est effectuée par un transporteur professionnel. Les délais de livraison sont indicatifs et communiqués au Client.</p>
                        <p>Le Vendeur s'engage à informer le Client de l'expédition de son Produit et, dans la mesure du possible, à communiquer un numéro de suivi.</p>
                        
                        <h3>8.3. Réception et vérification</h3>
                        <p>À la réception du Produit, le Client est tenu de vérifier l'état du colis et du Produit en présence du transporteur.</p>
                        <p>En cas de dommage apparent, de colis endommagé ou de pièce manquante, le Client doit :</p>
                        <p>(a) émettre des réserves détaillées, précises et complètes sur le bon de livraison du transporteur ;</p>
                        <p>(b) refuser le colis le cas échéant ;</p>
                        <p>(c) en informer le Vendeur dans un délai de trois (3) jours ouvrés suivant la livraison, par le biais du formulaire de contact disponible sur le Site, en joignant des photographies du Produit et de l'emballage.</p>
                        <p>L'absence de réserves émises lors de la livraison et de signalement dans le délai précité éteint toute réclamation au titre des dommages de transport.</p>
                        
                        <h3>8.4. Transfert des risques</h3>
                        <p>Pour les Clients Consommateurs, le transfert des risques s'opère au moment de la prise de possession physique du Produit par le Client ou un tiers désigné par lui, conformément à l'article L. 216-4 du Code de la consommation.</p>
                        <p>Pour les Clients Professionnels, le transfert des risques s'opère au moment de la remise du Produit au transporteur.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 9 — DROIT DE RÉTRACTATION — EXCLUSION POUR BIENS SUR MESURE</h2>
                        <h3>9.1. Principe</h3>
                        <p>Conformément aux articles L. 221-18 et suivants du Code de la consommation, le Consommateur qui conclut un contrat à distance dispose en principe d'un délai de quatorze (14) jours à compter de la réception du bien pour exercer son droit de rétractation, sans avoir à motiver sa décision ni à supporter de pénalité.</p>
                        
                        <h3>9.2. Exclusion applicable aux Produits du Site</h3>
                        <p>Toutefois, conformément à l'article L. 221-28, 3° du Code de la consommation , le droit de rétractation ne peut être exercé pour les contrats de fourniture de biens confectionnés selon les spécifications du consommateur ou nettement personnalisés.</p>
                        <p>Les Produits proposés sur le Site consistent exclusivement en des plans de travail en résine blanche fabriqués sur commande, sur la base des cotes, formes, découpes, perçages et options validés par le Client.</p>
                        <p>Ils constituent, au sens de l’article L. 22128, 3° du Code de la consommation, des biens confectionnés selon les spécifications du consommateur ou nettement personnalisés, de sorte que le Client consommateur ne dispose d’aucun droit de rétractation pour ces Produits.</p>
                        <p>Cette exclusion s’applique indépendamment de l’état d’avancement de la fabrication.</p>
                        <p>Pour les Produits qui, le cas échéant, ne présenteraient pas un caractère sur mesure ou nettement personnalisé au sens de ce texte, le Client consommateur bénéficie du droit de rétractation de quatorze (14) jours à compter de la réception, dans les conditions prévues aux articles L. 22118 et suivants du Code de la consommation.</p>
                        <p>En conséquence, le Client Consommateur reconnaît et accepte expressément qu'il ne bénéficie d'aucun droit de rétractation au titre des Commandes passées sur le Site.</p>
                        <p>Cette exclusion s'applique dès la passation de la Commande, indépendamment du fait que la fabrication du Produit ait ou non été entamée, conformément à la jurisprudence de la Cour de justice de l'Union européenne (CJUE, 21 octobre 2020, aff. C-529/19, Möbel Kraft).</p>
                        
                        <h3>9.3. Information du Client</h3>
                        <p>Le Client est informé de l'exclusion du droit de rétractation à plusieurs étapes du processus de commande, et notamment :</p>
                        <p>(a) sur la page de description des Produits ;</p>
                        <p>(b) dans le récapitulatif de la Commande, préalablement au paiement ;</p>
                        <p>(c) par une case à cocher spécifique, que le Client doit valider avant de finaliser sa Commande, rédigée comme suit : « Je reconnais que le Produit commandé est fabriqué sur mesure selon mes spécifications et que je ne bénéficie pas du droit de rétractation prévu aux articles L. 221-18 et suivants du Code de la consommation » ;</p>
                        <p>(d) dans l'accusé de réception de la Commande.</p>
                        <p>Avant la validation définitive de la Commande, le Client consommateur est informé de manière claire et lisible, sur la fiche Produit, dans le récapitulatif de commande et au sein des présentes CGV, qu’il ne bénéficie pas du droit de rétractation pour les Produits sur mesure, conformément à l’article L. 22128, 3° du Code de la consommation.</p>
                        <p>Il confirme expressément en cochant la case dédiée son accord sur la fabrication sur mesure et la perte de tout droit de rétractation une fois la Commande passée.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 10 — RÉCLAMATIONS, GARANTIES LÉGALES ET SERVICE APRÈS-VENTE</h2>
                        <h3>10.1. Réclamations</h3>
                        <p>Toute réclamation relative à un Produit doit être adressée au Vendeur via le formulaire de contact disponible sur le Site.</p>
                        <p>Le Vendeur s'engage à accuser réception de la réclamation et à y répondre dans un délai de soixante-douze (72) heures ouvrées.</p>
                        <p>Le Client devra fournir une description détaillée du défaut constaté, accompagnée de photographies.</p>
                        
                        <h3>10.2. Garantie légale de conformité</h3>
                        <p>Le Vendeur est tenu de la garantie légale de conformité dans les conditions des articles L. 217-3 et suivants du Code de la consommation.</p>
                        <p>Le Client Consommateur bénéficie d'un délai de deux (2) ans à compter de la délivrance du Produit pour agir au titre de cette garantie.</p>
                        <p>Tout défaut de conformité qui apparaît dans un délai de vingt-quatre (24) mois à compter de la délivrance du Produit est présumé exister au moment de la délivrance, sauf preuve contraire.</p>
                        <p>En cas de défaut de conformité avéré, le Client Consommateur a le choix entre la réparation et le remplacement du Produit.</p>
                        <p>Le Vendeur privilégiera la fabrication d'un nouveau Produit conforme dans un délai raisonnable, sans frais pour le Client.</p>
                        <p>Si la réparation ou le remplacement est impossible ou ne peut intervenir dans un délai raisonnable ou sans inconvénient majeur pour le Client, celui-ci peut obtenir une réduction du prix ou la résolution du contrat dans les conditions prévues par les articles L. 217-8 et suivants du Code de la consommation.</p>
                        <p>En cas de défaut de conformité au sens des articles L. 2173 et suivants du Code de la consommation, le Client consommateur a le choix entre la réparation ou le remplacement du Produit, sauf si l’une de ces solutions est impossible ou entraîne des coûts manifestement disproportionnés au regard de l’autre modalité, au sens de l’article L. 21712 du Code de la consommation.</p>
                        <p>Si la réparation et le remplacement sont impossibles, le Client peut obtenir une réduction du prix ou la résolution de la vente dans les conditions prévues aux articles L. 21713 et L. 21714.</p>
                        
                        <h3>10.3. Garantie légale des vices cachés</h3>
                        <p>Le Vendeur est tenu de la garantie des vices cachés dans les conditions des articles 1641 et suivants du Code civil.</p>
                        <p>Le Client peut, s'il établit l'existence d'un vice caché, choisir entre la résolution de la vente ou une réduction du prix, conformément à l'article 1644 du Code civil.</p>
                        
                        <h3>10.4. Reproduction légale des textes applicables</h3>
                        <p>Article L. 217-3 du Code de la consommation : « Le vendeur délivre un bien conforme au contrat ainsi qu'aux critères énoncés à l'article L. 217-5.</p>
                        <p>Il répond des défauts de conformité existant lors de la délivrance du bien au sens de l'article L. 217-4, qui apparaissent dans un délai de deux ans à compter de celle-ci.</p>
                        <p>»</p>
                        <p>Article 1641 du Code civil : « Le vendeur est tenu de la garantie à raison des défauts cachés de la chose vendue qui la rendent impropre à l'usage auquel on la destine, ou qui diminuent tellement cet usage que l'acheteur ne l'aurait pas acquise, ou n'en aurait donné qu'un moindre prix, s'il les avait connus.</p>
                        <p>»</p>
                        
                        <h3>10.5. Absence de garantie commerciale</h3>
                        <p>Le Vendeur ne propose pas de garantie commerciale au-delà des garanties légales visées ci-dessus.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 11 — RESPONSABILITÉ DU VENDEUR</h2>
                        <h3>11.1. Engagements du Vendeur</h3>
                        <p>Le Vendeur s'engage à fabriquer le Produit conformément aux spécifications validées par le Client dans le Configurateur et à le livrer dans les conditions définies aux présentes CGV.</p>
                        <p>La responsabilité du Vendeur est limitée à la bonne exécution de ses obligations de fabrication et de livraison.</p>
                        
                        <h3>11.2. Limitations de responsabilité — Clients Consommateurs</h3>
                        <p>Le Vendeur ne saurait être tenu responsable des dommages résultant :</p>
                        <p>(a) d'une erreur du Client dans la saisie des dimensions, cotes, perçages, découpes ou options dans le Configurateur ;</p>
                        <p>(b) d'une installation, d'une pose ou d'une mise en œuvre du Produit non conforme aux consignes d'utilisation et de pose fournies par le Vendeur ;</p>
                        <p>(c) d'une utilisation ou d'un entretien du Produit non conforme aux consignes d'utilisation et d'entretien fournies par le Vendeur ;</p>
                        <p>(d) de l'usure normale du Produit.</p>
                        <p>Ces limitations n'affectent en rien les droits du Client Consommateur au titre des garanties légales de conformité et des vices cachés, qui demeurent applicables dans les conditions prévues par la loi.</p>
                        <p>Les ÉTABLISSEMENTS GUÉGAN ne sauraient être tenus responsables des dommages résultant d’erreurs de cotes ou de choix techniques fournis par le Client, d’une pose effectuée par un tiers, d’une utilisation non conforme à la destination du Produit ou au mode d’emploi, ou d’un entretien inadapté.</p>
                        <p>Ces exclusions de responsabilité ne privent toutefois pas le Client consommateur du bénéfice des garanties légales de conformité et des vices cachés applicables aux Produits.</p>
                        
                        <h3>11.3. Limitations de responsabilité — Clients Professionnels</h3>
                        <p>En sus des limitations prévues à l'article 11.2, la responsabilité du Vendeur à l'égard des Clients Professionnels est limitée comme suit :</p>
                        <p>(a) La responsabilité du Vendeur est limitée aux dommages directs, prévisibles et prouvés, subis par le Client Professionnel ;</p>
                        <p>(b) Le Vendeur ne pourra en aucun cas être tenu responsable des préjudices indirects tels que, de manière non limitative, la perte de chiffre d'affaires, la perte de bénéfice, la perte de clientèle, la perte de chance, le préjudice commercial, le coût de l'obtention d'un produit de substitution, tout dommage ou préjudice consécutif ou incident ;</p>
                        <p>(c) En tout état de cause, le montant total de l'indemnisation pouvant être mise à la charge du Vendeur au titre d'une Commande est plafonné au montant effectivement payé par le Client Professionnel au titre de ladite Commande.</p>
                        
                        <h3>11.4. Consignes d'utilisation, de pose et d'entretien</h3>
                        <p>Le Vendeur met à la disposition du Client des consignes d'utilisation, de pose et d'entretien du Produit, accessibles sur le Site et/ou fournies avec le Produit.</p>
                        <p>Le respect de ces consignes conditionne l'application des garanties et l'examen de toute réclamation.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 12 — OBLIGATIONS ET RESPONSABILITÉ DU CLIENT</h2>
                        <p>Le Client s'engage à :</p>
                        <p>(a) fournir des informations exactes et complètes lors de la création de son compte et de la passation de sa Commande, en particulier s'agissant des dimensions, cotes, découpes, perçages et options renseignées dans le Configurateur ;</p>
                        <p>(b) vérifier avec la plus grande attention le récapitulatif de Commande avant de procéder au paiement ;</p>
                        <p>(c) vérifier l'état du Produit à la livraison et émettre les réserves nécessaires dans les conditions prévues à l'article 8.3 des présentes ;</p>
                        <p>Il appartient au Client de vérifier l’état apparent des colis à la livraison et, le cas échéant, d’émettre toutes réserves précises sur le bon de livraison et de les confirmer au transporteur dans un délai de trois (3) jours.</p>
                        <p>(d) respecter les consignes d'utilisation, de pose et d'entretien fournies par le Vendeur ;</p>
                        <p>(e) utiliser le Produit conformément à sa destination.</p>
                        <p>Le nonrespect de ce formalisme est sans préjudice de l’exercice par le Client consommateur de ses droits au titre de la garantie légale de conformité et de la garantie des vices cachés, qu’il conserve en toute hypothèse.</p>
                        <p>En cas de manquement à l'une de ces obligations, le Client est seul responsable des conséquences en résultant.</p>
                        <p>Le Vendeur ne saurait être tenu responsable des dommages liés à une erreur de spécification, une mauvaise pose, une utilisation non conforme ou un défaut d'entretien imputable au Client.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 13 — PROPRIÉTÉ INTELLECTUELLE</h2>
                        <p>L'ensemble des éléments du Site (textes, photographies, illustrations, vidéos, logos, marques, modèles de plans, designs, descriptifs techniques, logiciels, Configurateur) sont la propriété exclusive du Vendeur ou de ses partenaires et sont protégés par les dispositions du Code de la propriété intellectuelle.</p>
                        <p>Toute reproduction, représentation, modification, publication, transmission, adaptation, totale ou partielle, de ces éléments, par quelque moyen que ce soit, est strictement interdite sans l'accord écrit préalable du Vendeur.</p>
                        <p>Le Vendeur se réserve le droit d'utiliser, à des fins de communication et de promotion sur le Site et les réseaux sociaux, des photographies anonymisées de réalisations effectuées avec les Produits commandés par les Clients.</p>
                        <p>Ces photographies ne comporteront aucune donnée permettant d'identifier le Client.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 14 — DONNÉES PERSONNELLES</h2>
                        <p>Dans le cadre de l'utilisation du Site et du traitement des Commandes, le Vendeur est amené à collecter et traiter des données personnelles relatives au Client, notamment : identité, coordonnées postales et électroniques, données de paiement (via un prestataire de paiement sécurisé), historique de commandes.</p>
                        <p>Ces données sont collectées aux fins de :</p>
                        <p>(a) gestion des comptes Clients et des Commandes ;</p>
                        <p>(b) facturation et suivi des paiements ;</p>
                        <p>(c) livraison des Produits ;</p>
                        <p>(d) gestion des réclamations et du service après-vente ;</p>
                        <p>(e) prospection commerciale, envoi de newsletters et communications relatives à l'activité du Vendeur, sous réserve du consentement du Client lorsque celui-ci est requis ;</p>
                        <p>(f) statistiques et amélioration du Site.</p>
                        <p>Le traitement des données personnelles est réalisé conformément au Règlement (UE) 2016/679 du 27 avril 2016 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée relative à l'informatique, aux fichiers et aux libertés.</p>
                        <p>Le Vendeur peut recourir à des sous-traitants pour le traitement des données (hébergeur du Site, prestataire de paiement, prestataire informatique).</p>
                        <p>Le Client est informé que ces prestataires agissent sur instruction du Vendeur et dans le respect du RGPD.</p>
                        <p>Les modalités détaillées de collecte, de traitement, de conservation et d'exercice des droits (accès, rectification, effacement, portabilité, opposition, limitation) sont décrites dans la Politique de Confidentialité accessible sur le Site, à laquelle les présentes CGV renvoient expressément.</p>
                        <p>Hébergeur du Site : [À COMPLÉTER — nom, adresse et coordonnées de l'hébergeur]</p>
                    </section>

                    <section>
                        <h2>ARTICLE 15 — DROIT APPLICABLE ET RÈGLEMENT DES LITIGES</h2>
                        <h3>15.1. Droit applicable</h3>
                        <p>Les présentes CGV et les opérations de vente qui en découlent sont soumises au droit français.</p>
                        
                        <h3>15.2. Règlement amiable</h3>
                        <p>En cas de litige relatif aux présentes CGV ou à une Commande, le Client est invité à contacter en priorité le Vendeur via le formulaire de contact disponible sur le Site afin de rechercher une solution amiable.</p>
                        
                        <h3>15.3. Médiation de la consommation (Clients Consommateurs)</h3>
                        <p>Conformément aux articles L. 611-1 et suivants et R. 612-1 et suivants du Code de la consommation, le Client Consommateur a le droit de recourir gratuitement à un médiateur de la consommation en vue de la résolution amiable du litige qui l'opposerait au Vendeur, à condition d'avoir préalablement tenté de résoudre son litige directement auprès du Vendeur par une réclamation écrite.</p>
                        <p>Les ÉTABLISSEMENTS GUÉGAN ont désigné le médiateur suivant :</p>
                        <p>CM2C : 49 rue de Ponthieu, 75008 Paris à : cm2c.net/inscription-professionnel.php</p>
                        <p>Code adhérent FFB : 2024ffbZK</p>
                        <p>Le Client peut également recourir à la plateforme européenne de règlement en ligne des litiges accessible à l’adresse suivante : https://ec.europa.eu/consumers/odr/.</p>
                        <p>Le Client Consommateur peut également recourir à la plateforme européenne de règlement en ligne des litiges (RLL) accessible à l'adresse : https://ec.europa.eu/consumers/odr.</p>
                        
                        <h3>15.4. Juridiction compétente (Clients Professionnels)</h3>
                        <p>Pour tout litige entre le Vendeur et un Client Professionnel, les parties conviennent expressément de l'attribution de compétence exclusive au Tribunal de commerce de Bobigny , nonobstant pluralité de défendeurs ou appel en garantie, même pour les procédures d'urgence ou les procédures conservatoires, en référé ou par requête.</p>
                        
                        <h3>15.5. Juridiction compétente (Clients Consommateurs)</h3>
                        <p>Conformément aux règles de droit commun, le Client Consommateur peut saisir, à son choix, le tribunal du lieu de son domicile ou celui du lieu de livraison du Produit, outre le tribunal du lieu du siège social du Vendeur.</p>
                    </section>

                    <section>
                        <h2>ARTICLE 16 — DISPOSITIONS DIVERSES</h2>
                        <h3>16.1. Force majeure</h3>
                        <p>Le Vendeur ne saurait être tenu responsable de l'inexécution ou du retard dans l'exécution de ses obligations lorsque cette inexécution ou ce retard résulte d'un cas de force majeure au sens de l'article 1218 du Code civil, en ce compris, de manière non limitative, les catastrophes naturelles, incendies, grèves, pannes informatiques, ruptures d'approvisionnement en matières premières, épidémies ou pandémies, décisions gouvernementales ou administratives.</p>
                        
                        <h3>16.2. Nullité partielle</h3>
                        <p>Si l'une quelconque des stipulations des présentes CGV était déclarée nulle ou inapplicable en vertu d'une disposition légale, réglementaire ou d'une décision de justice, elle serait réputée non écrite, sans affecter la validité des autres stipulations, qui demeureront en vigueur.</p>
                        
                        <h3>16.3. Non-renonciation</h3>
                        <p>Le fait pour le Vendeur de ne pas se prévaloir à un moment donné de l'une quelconque des stipulations des présentes CGV ne saurait être interprété comme une renonciation à s'en prévaloir ultérieurement.</p>
                        
                        <h3>16.4. Intégralité</h3>
                        <p>Les présentes CGV, complétées par la Politique de Confidentialité, expriment l'intégralité des obligations des parties.</p>
                        <p>Elles se substituent à toutes les propositions, accords et publications antérieurs ayant le même objet.</p>
                        
                        <h3>16.5. Preuve</h3>
                        <p>Les registres informatisés, conservés dans les systèmes informatiques du Vendeur et de ses prestataires dans des conditions raisonnables de sécurité, seront considérés comme preuves des communications, des commandes et des paiements intervenus entre les parties, conformément à l'article 1366 du Code civil.</p>
                    </section>

                    <footer className="cgv-footer">
                        <h3>INFORMATIONS LÉGALES</h3>
                        <p>Directeur de la publication : Madame Aline MASSOULLE amassoulle@etsguegan.com</p>
                        <p>Hébergeur du Site : [À COMPLÉTER — nom, dénomination sociale, adresse, numéro de téléphone]</p>
                        <p>Prestataire de paiement : [À COMPLÉTER]</p>
                        <p>Médiateur de la consommation :</p>
                        <p>CM2C : 49 rue de Ponthieu, 75008 Paris à : cm2c.net/inscription-professionnel.php</p>
                        <p>Code adhérent FFB : 2024ffbZK</p>
                    </footer>
                </div>
            </div>
        </div>
    );
};

export default CGV;