import { auth } from '@/lib/auth'
import { getUsers, getCategories } from '@/actions/settings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProfileTab } from '@/components/settings/profile-tab'
import { UsersTab } from '@/components/settings/users-tab'
import { CategoriesTab } from '@/components/settings/categories-tab'
import { ImportTab } from '@/components/settings/import-tab'

export default async function SettingsPage() {
  const session = await auth()
  const isAdmin = session?.user?.role === 'ADMIN'

  const [users, categories] = await Promise.all([
    isAdmin ? getUsers() : Promise.resolve([]),
    isAdmin ? getCategories() : Promise.resolve([]),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuracion</h1>
        <p className="text-muted-foreground">
          Administra tu cuenta y preferencias del sistema
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <div className="overflow-x-auto -mx-1 px-1 pb-px">
          <TabsList className="w-max min-w-full">
            <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">Usuarios</TabsTrigger>}
            {isAdmin && <TabsTrigger value="categories">Categorias</TabsTrigger>}
            {isAdmin && <TabsTrigger value="import">Importar</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="profile">
          <ProfileTab user={session?.user} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="users">
            <UsersTab users={users} currentUserId={session?.user?.id || ''} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="categories">
            <CategoriesTab categories={categories} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="import">
            <ImportTab categories={categories} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
