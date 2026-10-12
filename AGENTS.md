<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Render the BOM register through the dedicated BomCard component while retaining shared filtering and pagination, so card actions remain consistent.
- Delete BOM headers through authenticated RLS-protected queries returning the deleted row; rely on the production-voucher foreign key and component cascade for history protection and atomic cleanup.
