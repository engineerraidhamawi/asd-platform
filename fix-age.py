import os

arabic = '\u0633\u0646\u0648\u0627\u062a'
new = "{lang === 'ar' ? '" + arabic + "' : 'years'}"

base = 'C:/asd-platform/src/components/asd'
for name in ['PatientListView.tsx', 'PatientDetailView.tsx', 'MyAssessmentsView.tsx']:
    path = os.path.join(base, name)
    if os.path.exists(path):
        content = open(path, encoding='utf-8').read()
        content = content.replace("{t('ageYears')}", new)
        content = content.replace('{t("ageYears")}', new)
        open(path, 'w', encoding='utf-8').write(content)
        print('Fixed: ' + name)
    else:
        print('Skip: ' + name)
