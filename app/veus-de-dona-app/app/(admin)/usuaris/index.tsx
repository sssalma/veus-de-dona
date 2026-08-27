import { useState, useCallback, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, Switch, TextInput, Modal, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect, Redirect } from "expo-router";
import { COLORS, FONTS } from "../../../constants";
import { useAuth } from "../../../contexts/AuthContext";
import { useLanguage } from "../../../contexts/LanguageContext";
import { etiquetaRol, ORDRE_ROLS } from "../../../i18n/etiquetes";
import { Capcalera } from "../../../components/Capcalera";
import FormField from "../../../components/FormField";
import { EstatLlista } from "../../../components/admin/LlistaAdmin";
import {
  getUsuaris,
  setUsuariActiu,
  setUsuariRol,
  assignarContrasenya,
} from "../../../services/usuaris";
import { missatgeError } from "../../../services/errors";
import { PASSWORD_MIN_LENGTH } from "../../../constants";
import { Usuari } from "../../../types";

/** Valor sentinella del filtre: no és cap rol, vol dir "no filtris". */
const SENSE_FILTRE = "TOTS";

export default function AdminUsuaris() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { resaltar } = useLocalSearchParams<{ resaltar?: string }>();
  const [usuaris, setUsuaris] = useState<Usuari[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [cerca, setCerca] = useState("");
  const [filtreRol, setFiltreRol] = useState<string>(SENSE_FILTRE);
  const [avis, setAvis] = useState<string | null>(null);
  // Compte al qual s'esta assignant una contrasenya nova, si n'hi ha cap.
  const [reset, setReset] = useState<Usuari | null>(null);
  const [novaContrasenya, setNovaContrasenya] = useState("");
  const [assignant, setAssignant] = useState(false);

  const carregar = useCallback(() => {
    setLoading(true);
    getUsuaris()
      .then((dades) => {
        setUsuaris(dades);
        setError(false);
      })
      .catch(() => {
        setUsuaris([]);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(carregar);

  const usuarisFiltrats = useMemo(() => {
    const q = cerca.trim().toLowerCase();
    return usuaris.filter((u) => {
      if (filtreRol !== SENSE_FILTRE && u.rol !== filtreRol) return false;
      if (!q) return true;
      return (
        u.nom.toLowerCase().includes(q) ||
        u.cognom.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [usuaris, cerca, filtreRol]);

  if (user && user.rol !== "ADMINISTRADOR") {
    return <Redirect href="/(admin)" />;
  }

  // Les dues accions són optimistes: es pinten sense esperar el servidor.
  // Si el rebutja, es desfan i es diu en pantalla.
  const handleToggleActiu = async (u: Usuari, valor: boolean) => {
    setAvis(null);
    setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, actiu: valor } : x)));
    try {
      await setUsuariActiu(u.id, valor);
    } catch {
      setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, actiu: !valor } : x)));
      setAvis(t("admin.changeFailed"));
    }
  };

  const handleCanviarRol = async (u: Usuari, rol: string) => {
    if (rol === u.rol) return;
    setAvis(null);
    const anterior = u.rol;
    setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol } : x)));
    try {
      await setUsuariRol(u.id, rol);
    } catch {
      setUsuaris((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol: anterior } : x)));
      setAvis(t("admin.changeFailed"));
    }
  };

  const handleAssignarContrasenya = async () => {
    if (!reset) return;
    if (novaContrasenya.length < PASSWORD_MIN_LENGTH) {
      Alert.alert(t("common.error"), t("auth.passwordMinLength"));
      return;
    }
    setAssignant(true);
    try {
      await assignarContrasenya(reset.id, novaContrasenya);
      setReset(null);
      setNovaContrasenya("");
      Alert.alert(t("admin.setPasswordDone"), t("admin.setPasswordDoneMsg"));
    } catch (err) {
      Alert.alert(t("common.error"), missatgeError(err, t("admin.setPasswordError")));
    } finally {
      setAssignant(false);
    }
  };

  const filtres = [SENSE_FILTRE, ...ORDRE_ROLS];

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <Capcalera tornarA="panell" titol={t("admin.usuaris")} />

        <View style={{ paddingHorizontal: 18, paddingTop: 16, gap: 10 }}>
          <TextInput
            accessibilityLabel={t("admin.searchUsersLabel")}
            placeholder={t("admin.searchUsers")}
            placeholderTextColor={COLORS.textSecondary}
            value={cerca}
            onChangeText={setCerca}
            autoCapitalize="none"
            autoCorrect={false}
            maxFontSizeMultiplier={1.5}
            style={{
              borderWidth: 1,
              borderColor: COLORS.controlBorder,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              fontFamily: FONTS.sans,
              fontSize: 13,
              color: COLORS.text,
              backgroundColor: COLORS.lightBg,
              minHeight: 46,
            }}
          />

          <View
            accessibilityRole="radiogroup"
            accessibilityLabel={t("admin.filterByRole")}
            style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
          >
            {filtres.map((rol) => {
              const etiqueta = rol === SENSE_FILTRE ? t("admin.filterAll") : etiquetaRol(t, rol);
              return (
                <Xip
                  key={rol}
                  etiqueta={etiqueta}
                  seleccionat={rol === filtreRol}
                  accessibilityLabel={`${t("admin.filterPrefix")}: ${etiqueta}`}
                  onPress={() => setFiltreRol(rol)}
                />
              );
            })}
          </View>
        </View>

        {avis && (
          <Text
            accessibilityRole="alert"
            style={{
              fontFamily: FONTS.sans,
              fontSize: 12,
              color: COLORS.love,
              paddingHorizontal: 18,
              paddingTop: 12,
            }}
            maxFontSizeMultiplier={1.5}
          >
            {avis}
          </Text>
        )}

        <EstatLlista
          loading={loading}
          error={error}
          buit={usuarisFiltrats.length === 0}
          missatgeBuit={t("admin.noUsersMatch")}
        />

        {!loading && !error && usuarisFiltrats.length > 0 && (
          <View style={{ paddingHorizontal: 18, paddingTop: 18, gap: 10 }}>
            {usuarisFiltrats.map((u) => {
              const resaltat = u.id === resaltar;
              // El servidor rebutja amb un 400 que una administradora es canviï
              // el rol o es desactivi: amb un sol compte d'administració això
              // deixaria el sistema sense manera de tornar a entrar. Aquí es
              // desactiven els controls perquè no s'arribi a intentar.
              const esJo = u.id === user?.id;

              return (
                <View
                  key={u.id}
                  style={{
                    borderWidth: resaltat ? 2 : 1,
                    borderColor: resaltat ? COLORS.accent : COLORS.border,
                    backgroundColor: resaltat ? COLORS.lightBg : "transparent",
                    borderRadius: 12,
                    padding: 14,
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 13,
                          fontWeight: "600",
                          color: COLORS.text,
                        }}
                        maxFontSizeMultiplier={1.5}
                      >
                        {u.nom} {u.cognom}
                      </Text>
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 12,
                          color: COLORS.textSecondary,
                          marginTop: 2,
                        }}
                        maxFontSizeMultiplier={1.4}
                      >
                        {u.email}
                      </Text>
                      {esJo && (
                        <Text
                          style={{
                            fontFamily: FONTS.sans,
                            fontSize: 11,
                            fontWeight: "700",
                            letterSpacing: 0.5,
                            textTransform: "uppercase",
                            color: COLORS.badgeText,
                            marginTop: 4,
                          }}
                          maxFontSizeMultiplier={1.3}
                        >
                          {t("admin.yourAccount")}
                        </Text>
                      )}
                    </View>

                    <Switch
                      accessibilityRole="switch"
                      accessibilityLabel={`${u.nom} ${u.cognom}: ${
                        u.actiu ? t("admin.accountActive") : t("admin.accountInactive")
                      }`}
                      accessibilityHint={esJo ? t("admin.cannotEditSelf") : undefined}
                      disabled={esJo}
                      value={u.actiu}
                      onValueChange={(v) => handleToggleActiu(u, v)}
                    />
                  </View>

                  <View
                    accessibilityRole="radiogroup"
                    accessibilityLabel={`${t("admin.roleOf")} ${u.nom} ${u.cognom}`}
                    style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
                  >
                    {ORDRE_ROLS.map((rol) => (
                      <Xip
                        key={rol}
                        etiqueta={etiquetaRol(t, rol)}
                        seleccionat={rol === u.rol}
                        desactivat={esJo}
                        accessibilityLabel={etiquetaRol(t, rol)}
                        onPress={() => handleCanviarRol(u, rol)}
                      />
                    ))}
                  </View>

                  {esJo ? (
                    <Text
                      style={{
                        fontFamily: FONTS.sans,
                        fontSize: 11,
                        color: COLORS.textSecondary,
                        fontStyle: "italic",
                        lineHeight: 15,
                      }}
                      maxFontSizeMultiplier={1.4}
                    >
                      {t("admin.cannotEditSelf")}
                    </Text>
                  ) : (
                    /* L'unic cami de tornada per a qui ha oblidat la seva: no
                       hi ha recuperacio per correu. Sobre el propi compte no
                       surt, que ha de passar pel canvi del perfil. */
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`${t("admin.setPassword")}: ${u.nom} ${u.cognom}`}
                      onPress={() => {
                        setNovaContrasenya("");
                        setReset(u);
                      }}
                      style={{ minHeight: 44, justifyContent: "center" }}
                    >
                      <Text
                        style={{
                          fontFamily: FONTS.sans,
                          fontSize: 12,
                          fontWeight: "600",
                          color: COLORS.accent,
                        }}
                        maxFontSizeMultiplier={1.4}
                      >
                        {t("admin.setPassword")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Alert.prompt nomes existeix a iOS, de manera que el dialeg es propi */}
      <Modal
        visible={reset !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setReset(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(30,20,42,0.55)",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <View style={{ backgroundColor: COLORS.bg, borderRadius: 14, padding: 20, gap: 12 }}>
            <Text
              accessibilityRole="header"
              style={{ fontFamily: FONTS.serif, fontSize: 18, color: COLORS.text }}
              maxFontSizeMultiplier={1.3}
            >
              {t("admin.setPassword")}
            </Text>

            {reset && (
              <Text
                style={{ fontFamily: FONTS.sans, fontSize: 13, color: COLORS.text }}
                maxFontSizeMultiplier={1.4}
              >
                {reset.nom} {reset.cognom} · {reset.email}
              </Text>
            )}

            {/* revelable: qui assigna la contrasenya l'ha de comunicar despres,
                i tapada no hi ha manera de comprovar que s'ha escrit be */}
            <FormField
              label={t("admin.newPasswordLabel")}
              placeholder={t("admin.newPasswordLabel")}
              value={novaContrasenya}
              onChangeText={setNovaContrasenya}
              revelable
              autoCapitalize="none"
              autoCorrect={false}
              contenidorStyle={{ marginBottom: 0 }}
              style={{
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 13,
                minHeight: 46,
              }}
            />

            <Text
              style={{
                fontFamily: FONTS.sans,
                fontSize: 12,
                color: COLORS.textSecondary,
                lineHeight: 16,
              }}
              maxFontSizeMultiplier={1.4}
            >
              {t("admin.setPasswordHint")}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("common.cancel")}
                onPress={() => setReset(null)}
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.controlBorder,
                  borderRadius: 8,
                  minHeight: 46,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 13,
                    color: COLORS.text,
                    textAlign: "center",
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t("admin.assign")}
                accessibilityState={{ disabled: assignant, busy: assignant }}
                onPress={handleAssignarContrasenya}
                disabled={assignant}
                style={{
                  flex: 1,
                  backgroundColor: COLORS.darkBg,
                  borderRadius: 8,
                  minHeight: 46,
                  justifyContent: "center",
                  opacity: assignant ? 0.55 : 1,
                }}
              >
                <Text
                  style={{
                    fontFamily: FONTS.sans,
                    fontSize: 13,
                    fontWeight: "600",
                    color: COLORS.bg,
                    textAlign: "center",
                  }}
                  maxFontSizeMultiplier={1.4}
                >
                  {t("admin.assign")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Xip({
  etiqueta,
  seleccionat,
  desactivat = false,
  accessibilityLabel,
  onPress,
}: {
  etiqueta: string;
  seleccionat: boolean;
  desactivat?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      accessibilityRole="radio"
      accessibilityState={{ selected: seleccionat, disabled: desactivat }}
      accessibilityLabel={accessibilityLabel}
      disabled={desactivat}
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: seleccionat ? COLORS.darkBg : COLORS.controlBorder,
        backgroundColor: seleccionat ? COLORS.darkBg : "transparent",
        opacity: desactivat ? 0.45 : 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        minHeight: 44,
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: FONTS.sans,
          fontSize: 12,
          fontWeight: seleccionat ? "600" : "400",
          color: seleccionat ? COLORS.bg : COLORS.textSecondary,
        }}
        maxFontSizeMultiplier={1.3}
      >
        {etiqueta}
      </Text>
    </TouchableOpacity>
  );
}
